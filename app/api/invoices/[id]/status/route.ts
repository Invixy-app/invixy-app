import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import db from "@/lib/db";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "VIEWED", "PAID", "PARTIAL_PAID", "OVERDUE", "CANCELLED", "REFUNDED"])
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
      }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
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