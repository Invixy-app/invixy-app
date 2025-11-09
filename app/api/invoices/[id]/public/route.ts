import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the invoice with all related data (no auth required for public access)
    const invoice = await db.invoice.findUnique({
      where: {
        id: id
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            billingAddress: true,
            logo: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            billingAddress: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true
              }
            },
            itemTaxes: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        },
        taxes: true,
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            reference: true
          },
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Transform the data for the response
    const responseData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() || null,
      notes: invoice.notes,
      terms: invoice.terms,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal),
      totalTax: Number(invoice.totalTax),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      business: invoice.business,
      customer: invoice.customer,
      items: invoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount),
        lineTotal: Number(item.lineTotal),
        product: item.product,
        itemTaxes: item.itemTaxes.map(tax => ({
          taxSystemId: tax.taxSystemId,
          taxableAmount: Number(tax.taxableAmount),
          taxRate: Number(tax.taxRate),
          taxAmount: Number(tax.taxAmount)
        }))
      })),
      taxes: invoice.taxes.map(tax => ({
        taxSystemId: tax.taxSystemId,
        taxableAmount: Number(tax.taxableAmount),
        taxRate: Number(tax.taxRate),
        taxAmount: Number(tax.taxAmount)
      })),
      payments: invoice.payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate.toISOString(),
        paymentMethod: payment.paymentMethod,
        reference: payment.reference
      }))
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("[INVOICE_PUBLIC_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
