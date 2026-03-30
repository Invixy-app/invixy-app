import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getInvoicesByBusiness, createInvoice } from "@/lib/invoice";
import { InvoiceStatus } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth-config";
import { checkInvoiceLimit } from "@/lib/subscription";
import db from "@/lib/db";

import { invoiceSchema } from "@/lib/validations/invoice";

const createInvoiceSchema = invoiceSchema.and(z.object({
  businessId: z.string(),
}));

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status") as InvoiceStatus;
    const customerId = searchParams.get("customerId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const paginated = searchParams.get("paginated") === "true";

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    if (!paginated) {
      const invoices = await getInvoicesByBusiness(businessId, session.user.id, filters);
      return NextResponse.json(invoices);
    }

    const access = await db.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "10")));
    const search = (searchParams.get("search") || "").trim();

    const whereClause: any = {
      businessId,
    };

    if (status) whereClause.status = status;
    if (customerId) whereClause.customerId = customerId;
    if (dateFrom || dateTo) {
      whereClause.issueDate = {};
      if (dateFrom) whereClause.issueDate.gte = new Date(dateFrom);
      if (dateTo) whereClause.issueDate.lte = new Date(dateTo);
    }
    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [itemsRaw, total, allRows] = await Promise.all([
      db.invoice.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              billingAddress: true,
            },
          },
          items: {
            include: {
              itemTaxes: {
                include: {
                  taxSystem: {
                    select: {
                      name: true,
                      taxId: true,
                    },
                  },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          taxes: {
            include: {
              taxSystem: {
                select: {
                  name: true,
                  taxId: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMethod: true,
              reference: true,
            },
            orderBy: { paymentDate: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.invoice.count({ where: whereClause }),
      db.invoice.findMany({
        where: { businessId },
        select: {
          status: true,
          totalAmount: true,
          paidAmount: true,
        },
      }),
    ]);

    const items = itemsRaw.map((invoice) => ({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      totalTax: Number(invoice.totalTax),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : null,
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount),
        lineTotal: Number(item.lineTotal),
        itemTaxes: item.itemTaxes?.map((itemTax) => ({
          taxSystemId: itemTax.taxSystemId,
          taxableAmount: Number(itemTax.taxableAmount),
          taxRate: Number(itemTax.taxRate),
          taxAmount: Number(itemTax.taxAmount),
          taxSystem: itemTax.taxSystem
            ? {
                name: itemTax.taxSystem.name,
                taxId: itemTax.taxSystem.taxId,
              }
            : undefined,
        })),
      })),
      taxes: invoice.taxes.map((tax) => ({
        taxSystemId: tax.taxSystemId,
        taxableAmount: Number(tax.taxableAmount),
        taxRate: Number(tax.taxRate),
        taxAmount: Number(tax.taxAmount),
        taxSystem: tax.taxSystem
          ? {
              name: tax.taxSystem.name,
              taxId: tax.taxSystem.taxId,
            }
          : undefined,
      })),
      payments: invoice.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }));

    const stats = {
      total: allRows.length,
      draft: allRows.filter((i) => i.status === "DRAFT").length,
      sent: allRows.filter((i) => i.status === "SENT").length,
      paid: allRows.filter((i) => i.status === "PAID").length,
      cancelled: allRows.filter((i) => i.status === "CANCELLED").length,
      totalRevenue: allRows
        .filter((i) => i.status === "SENT" || i.status === "PAID")
        .reduce((sum, i) => sum + Number(i.totalAmount), 0),
      totalPaid: allRows.reduce((sum, i) => sum + Number(i.paidAmount), 0),
      totalOutstanding: allRows
        .filter((i) => i.status === "SENT")
        .reduce((sum, i) => sum + Math.max(Number(i.totalAmount) - Number(i.paidAmount), 0), 0),
    };

    return NextResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats,
    });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    const limitCheck = await checkInvoiceLimit(validatedData.businessId);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const invoice = await createInvoice(validatedData, session.user.id);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}