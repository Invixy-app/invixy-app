import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/db';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDateRange(tf: string): { gte: Date; lte: Date; label: string } {
  const now = new Date();
  const lte = new Date(now);
  let gte;
  let label;
  if (tf === '30d') {
    gte = startOfDay(new Date(now.getTime() - 29 * DAY_MS));
    label = 'Last 30 Days';
  } else if (tf === '90d') {
    gte = startOfDay(new Date(now.getTime() - 89 * DAY_MS));
    label = 'Last 90 Days';
  } else if (tf === 'ytd') {
    gte = new Date(now.getFullYear(), 0, 1);
    label = 'Year to Date';
  } else {
    gte = new Date(now.getTime() - 365 * DAY_MS);
    label = 'Last 365 Days';
  }
  return { gte, lte, label };
}

const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: businessId } = await params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const format = searchParams.get('format') || 'xlsx';
    
    const { gte, lte, label } = getDateRange(timeframe);

    // Verify business access
    const userRole = await prisma.businessUserRole.findUnique({
      where: { userId_businessId: { userId: session.user.id, businessId } }
    });
    if (!userRole) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, currency: true }
    });
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const [invoicesInRange, taxLineItems, expensesInRange] = await Promise.all([
      prisma.invoice.findMany({
        where: { businessId, status: { in: ['SENT', 'PAID'] }, issueDate: { gte, lte } },
        select: { 
          id: true, 
          invoiceNumber: true, 
          issueDate: true, 
          totalAmount: true, 
          paidAmount: true, 
          currency: true, 
          exchangeRate: true,
          status: true,
          customer: { select: { name: true } }
        },
        orderBy: { issueDate: 'asc' },
      }),
      prisma.invoiceItemTax.findMany({
        where: { invoiceItem: { invoice: { businessId, status: { in: ['SENT', 'PAID'] }, issueDate: { gte, lte } } } },
        select: {
          taxableAmount: true, taxRate: true, taxAmount: true,
          taxSystem: { select: { name: true, taxType: true, rate: true } },
          invoiceItem: { select: { invoice: { select: { id: true, currency: true, exchangeRate: true } } } },
        },
      }),
      prisma.expense.findMany({
        where: { businessId, status: 'COMPLETED', date: { gte } },
        select: { amount: true, currency: true, date: true, description: true, category: { select: { name: true } }, paymentMethod: true },
        orderBy: { date: 'asc' },
      })
    ]);

    // Process Summary
    const totalRevenue = invoicesInRange.reduce((s, inv) => s + toNum(inv.totalAmount) * (toNum(inv.exchangeRate) || 1), 0);
    const totalOutstanding = invoicesInRange.reduce((s, inv) => {
      const due = toNum(inv.totalAmount) - toNum(inv.paidAmount);
      return due > 0 ? s + due * (toNum(inv.exchangeRate) || 1) : s;
    }, 0);
    const totalInvoices = invoicesInRange.length;

    // Process Taxes
    const taxMap = new Map();
    for (const row of taxLineItems) {
      if (!row.taxSystem) continue;
      const key = `${row.taxSystem.name}__${toNum(row.taxSystem.rate)}`;
      const fx = toNum(row.invoiceItem.invoice.exchangeRate) || 1;
      const e = taxMap.get(key) ?? { jurisdiction: row.taxSystem.name, taxType: row.taxSystem.taxType, taxCollected: 0 };
      e.taxCollected += toNum(row.taxAmount) * fx;
      taxMap.set(key, e);
    }
    const taxJurisdictions = Array.from(taxMap.values());
    const totalTaxCollected = taxJurisdictions.reduce((s, t) => s + t.taxCollected, 0);

    const transactions = invoicesInRange.map(inv => ({
      date: new Date(inv.issueDate).toISOString(),
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name || 'Unknown',
      status: inv.status,
      totalAmount: toNum(inv.totalAmount) * (toNum(inv.exchangeRate) || 1),
      paidAmount: toNum(inv.paidAmount) * (toNum(inv.exchangeRate) || 1),
      amountDue: (toNum(inv.totalAmount) - toNum(inv.paidAmount)) * (toNum(inv.exchangeRate) || 1),
    }));

    const expensesList = expensesInRange.map(exp => ({
      date: new Date(exp.date).toISOString(),
      categoryName: exp.category?.name || 'Uncategorized',
      description: exp.description || '',
      paymentMethod: exp.paymentMethod || '',
      amount: toNum(exp.amount),
    }));
    const totalExpenses = expensesList.reduce((s, e) => s + e.amount, 0);

    const reportData = {
      businessName: business.name,
      timeframeLabel: `${label} (${gte.toLocaleDateString()} - ${lte.toLocaleDateString()})`,
      currency: business.currency,
      summary: {
        totalRevenue,
        totalExpenses,
        totalOutstanding,
        totalTaxCollected,
        totalInvoices,
        netIncome: totalRevenue - totalExpenses - totalTaxCollected
      },
      taxJurisdictions,
      transactions,
      expensesList
    };

    // Generate XLSX
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Summary
    const summaryData = [
      ['Financial Statement Summary'],
      ['Business', reportData.businessName],
      ['Period', reportData.timeframeLabel],
      ['Currency', reportData.currency],
      [],
      ['Total Revenue', reportData.summary.totalRevenue],
      ['Total Expenses', reportData.summary.totalExpenses],
      ['Total Tax Collected (Owed)', reportData.summary.totalTaxCollected],
      ['Net Income', reportData.summary.netIncome],
      [],
      ['Total Outstanding Receivables', reportData.summary.totalOutstanding],
      ['Total Invoices', reportData.summary.totalInvoices]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Transactions
    const wsTransactions = XLSX.utils.json_to_sheet(
      reportData.transactions.map(t => ({
        'Date': new Date(t.date).toLocaleDateString(),
        'Invoice No': t.invoiceNumber,
        'Customer': t.customerName,
        'Status': t.status,
        ['Total Amount (' + reportData.currency + ')']: t.totalAmount,
        ['Paid Amount (' + reportData.currency + ')']: t.paidAmount,
        ['Amount Due (' + reportData.currency + ')']: t.amountDue,
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Sales & Receivables');

    // Sheet 3: Taxes
    const wsTaxes = XLSX.utils.json_to_sheet(
      reportData.taxJurisdictions.map(t => ({
        'Jurisdiction': t.jurisdiction,
        'Tax Type': t.taxType,
        ['Tax Collected (' + reportData.currency + ')']: t.taxCollected
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsTaxes, 'Tax Liabilities');

    // Sheet 4: Expenses
    if (reportData.expensesList.length > 0) {
      const wsExpenses = XLSX.utils.json_to_sheet(
        reportData.expensesList.map(e => ({
          'Date': new Date(e.date).toLocaleDateString(),
          'Category': e.categoryName,
          'Description': e.description,
          'Payment Method': e.paymentMethod,
          ['Amount (' + reportData.currency + ')']: e.amount
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Operating Expenses');
    }

    const fileContent = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const buffer = new Uint8Array(fileContent);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="financial_statement_${business.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Financial Statement generation error:', error);
    return NextResponse.json({ error: 'Failed to generate financial statement' }, { status: 500 });
  }
}
