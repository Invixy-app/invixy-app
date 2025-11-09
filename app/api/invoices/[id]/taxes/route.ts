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

    // Remove existing taxes for this invoice (both invoice-level and item-level)
    await db.invoiceTax.deleteMany({
      where: { invoiceId: id }
    });

    // Get all item IDs for this invoice
    const itemIds = invoice.items.map(item => item.id);
    
    await db.invoiceItemTax.deleteMany({
      where: { 
        invoiceItemId: { 
          in: itemIds 
        } 
      }
    });

    // Apply new tax systems at item level
    const itemTaxEntries = [];
    let totalTax = 0;

    for (const item of invoice.items) {
      const itemSubtotal = Number(item.lineTotal);
      let itemTotalTax = 0;

      for (const taxSystem of taxSystems) {
        const taxAmount = itemSubtotal * Number(taxSystem.rate);
        itemTotalTax += taxAmount;

        itemTaxEntries.push({
          invoiceItemId: item.id,
          taxSystemId: taxSystem.id,
          taxableAmount: itemSubtotal,
          taxRate: Number(taxSystem.rate),
          taxAmount: taxAmount
        });
      }

      // Update the item's tax amount
      await db.invoiceItem.update({
        where: { id: item.id },
        data: { taxAmount: itemTotalTax }
      });

      totalTax += itemTotalTax;
    }

    // Create new item tax entries
    if (itemTaxEntries.length > 0) {
      await db.invoiceItemTax.createMany({
        data: itemTaxEntries
      });
    }

    // Calculate subtotal
    const subtotal = Number(invoice.subtotal);

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
            product: true,
            itemTaxes: {
              include: {
                taxSystem: true
              }
            }
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