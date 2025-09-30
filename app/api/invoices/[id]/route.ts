import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getInvoiceById } from "@/lib/invoice";
import { InvoiceStatus } from "@prisma/client";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(id, businessId, session.user.id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    if (error.message === "Access denied") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, ...updateData } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const { id } = await params;
    // Verify user has access to this business and invoice
    const userRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      }
    });

    if (!userRole || userRole.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Check if invoice exists and belongs to the business
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        businessId: businessId
      }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update the invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
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
          orderBy: { sortOrder: 'asc' }
        },
        taxes: true,
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    });

    return NextResponse.json({
      ...updatedInvoice,
      subtotal: Number(updatedInvoice.subtotal),
      totalTax: Number(updatedInvoice.totalTax),
      totalAmount: Number(updatedInvoice.totalAmount),
      paidAmount: Number(updatedInvoice.paidAmount),
      exchangeRate: updatedInvoice.exchangeRate ? Number(updatedInvoice.exchangeRate) : null,
      items: updatedInvoice.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        lineTotal: Number(item.lineTotal)
      })),
      taxes: updatedInvoice.taxes.map(tax => ({
        taxSystemId: tax.taxSystemId,
        taxableAmount: Number(tax.taxableAmount),
        taxRate: Number(tax.taxRate),
        taxAmount: Number(tax.taxAmount)
      })),
      payments: updatedInvoice.payments.map(payment => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    });
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const { id } = await params;
    // Verify user has access to this business
    const userRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      }
    });

    if (!userRole || userRole.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Check if invoice exists and belongs to the business
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        businessId: businessId
      }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if invoice has payments - if so, we shouldn't allow deletion
    const paymentsCount = await prisma.payment.count({
      where: { invoiceId: id }
    });

    if (paymentsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete invoice with payments. Please void the invoice instead." },
        { status: 400 }
      );
    }

    // Delete related records first
    await prisma.$transaction([
      prisma.invoiceItem.deleteMany({
        where: { invoiceId: id }
      }),
      prisma.invoiceTax.deleteMany({
        where: { invoiceId: id }
      }),
      prisma.invoice.delete({
        where: { id: id }
      })
    ]);

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete invoice" },
      { status: 500 }
    );
  }
}