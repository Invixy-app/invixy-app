import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import db from "@/lib/db";
import { z } from "zod";
import { authOptions } from "@/lib/auth-config";

const taxApplicationSchema = z.object({
  taxSystemIds: z.array(z.string()).min(1, "At least one tax system is required")
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = taxApplicationSchema.parse(body);

    const { id } = await params;
    // Get the invoice and verify access
    const invoice = await db.invoice.findFirst({
      where: {
        id: id,
        business: {
          BusinessUserRole: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        items: true,
        taxes: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get the tax systems
    const taxSystems = await db.taxSystem.findMany({
      where: {
        id: { in: validatedData.taxSystemIds },
        businessId: invoice.businessId
      }
    });

    if (taxSystems.length !== validatedData.taxSystemIds.length) {
      return NextResponse.json(
        { error: "One or more tax systems not found" },
        { status: 404 }
      );
    }

    // Remove existing taxes for this invoice
    await db.invoiceTax.deleteMany({
      where: { invoiceId: id }
    });

    // Calculate subtotal from items
    const subtotal = Number(invoice.subtotal);

    // Apply new tax systems
    const taxEntries = [];
    let totalTax = 0;

    for (const taxSystem of taxSystems) {
      const taxAmount = subtotal * Number(taxSystem.rate);
      totalTax += taxAmount;

      taxEntries.push({
        invoiceId: id,
        taxSystemId: taxSystem.id,
        taxableAmount: subtotal,
        taxRate: Number(taxSystem.rate),
        taxAmount: taxAmount
      });
    }

    // Create new tax entries
    await db.invoiceTax.createMany({
      data: taxEntries
    });

    // Update invoice totals
    const newTotalAmount = subtotal + totalTax;
    
    const updatedInvoice = await db.invoice.update({
      where: { id: id },
      data: {
        totalTax: totalTax,
        totalAmount: newTotalAmount
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        taxes: {
          include: {
            taxSystem: true
          }
        },
        payments: true
      }
    });

    return NextResponse.json(updatedInvoice);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[INVOICE_TAXES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}