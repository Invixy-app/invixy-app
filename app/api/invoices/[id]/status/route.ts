import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import db from "@/lib/db";
import { z } from "zod";
import { updateProductStock } from "@/lib/product";

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    const { id } = await params;
    // First check if the invoice exists and user has access
    const existingInvoice = await db.invoice.findFirst({
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
        items: true
      }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Handle inventory updates
    const oldStatus = existingInvoice.status;
    const newStatus = validatedData.status;
    
    // Statuses that imply stock has been deducted
    const stockDeductedStatuses = ["SENT", "PAID"];
    
    const wasDeducted = stockDeductedStatuses.includes(oldStatus);
    const willBeDeducted = stockDeductedStatuses.includes(newStatus);
    
    if (!wasDeducted && willBeDeducted) {
      // Deduct stock
      for (const item of existingInvoice.items) {
        if (item.productId) {
          await updateProductStock(item.productId, Number(item.quantity), 'subtract', session.user.id);
        }
      }
    } else if (wasDeducted && !willBeDeducted) {
      // Return stock (e.g. cancelled or back to draft)
      for (const item of existingInvoice.items) {
        if (item.productId) {
          await updateProductStock(item.productId, Number(item.quantity), 'add', session.user.id);
        }
      }
    }

    // Update the invoice status
    const updatedInvoice = await db.invoice.update({
      where: { id: id },
      data: { status: validatedData.status },
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

    console.error("[INVOICE_STATUS_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}