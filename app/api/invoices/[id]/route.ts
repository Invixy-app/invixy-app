import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getInvoiceById, updateInvoice } from "@/lib/invoice";
import { InvoiceStatus } from "@prisma/client";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth-config";
import { z } from "zod";

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.001, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  discount: z.number().min(0).default(0),
  taxSystemIds: z.array(z.string()).default([])
});

const updateInvoiceSchema = z.object({
  customerId: z.string().optional(),
  issueDate: z.string().transform((str) => new Date(str)).optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().optional(),
  items: z.array(invoiceItemSchema).optional()
});

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
    const validatedData = updateInvoiceSchema.parse(body);
    const { id } = await params;

    // Update invoice using the lib function
    const updatedInvoice = await updateInvoice(id, validatedData, session.user.id);

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error.message === "Invoice not found") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    if (error.message === "Can only edit draft invoices") {
      return NextResponse.json({ error: "Can only edit draft invoices" }, { status: 400 });
    }
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
      prisma.invoiceItemTax.deleteMany({
        where: { 
          invoiceItem: {
            invoiceId: id
          }
        }
      }),
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