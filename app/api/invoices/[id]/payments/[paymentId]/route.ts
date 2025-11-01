import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import db from "@/lib/db";
import { z } from "zod";
import { authOptions } from "@/lib/auth-config";

const paymentUpdateSchema = z.object({
  amount: z.number().min(0.01),
  paymentDate: z.string().transform((str) => new Date(str)),
  method: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "CHECK", "OTHER"]),
  reference: z.string().optional(),
  notes: z.string().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = paymentUpdateSchema.parse(body);
    const { id: invoiceId, paymentId } = await params;

    // Get the payment and verify access through invoice
    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        invoice: {
          id: invoiceId,
          business: {
            BusinessUserRole: {
              some: {
                userId: session.user.id,
                role: {
                  in: ["OWNER", "MANAGER"]
                }
              }
            }
          }
        }
      },
      include: {
        invoice: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found or access denied" }, { status: 404 });
    }

    // Calculate current paid amount excluding this payment
    const currentPaidAmount = payment.invoice.payments
      .filter((p: any) => p.id !== paymentId)
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    
    const totalAmount = Number(payment.invoice.totalAmount);
    const availableBalance = totalAmount - currentPaidAmount;

    // Validate new payment amount
    if (validatedData.amount > availableBalance) {
      return NextResponse.json(
        { error: "Payment amount exceeds available balance" },
        { status: 400 }
      );
    }

    // Update the payment
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        amount: validatedData.amount,
        paymentDate: validatedData.paymentDate,
        paymentMethod: validatedData.method,
        reference: validatedData.reference,
        notes: validatedData.notes
      }
    });

    // Recalculate invoice totals
    const newPaidAmount = currentPaidAmount + validatedData.amount;
    const newStatus = newPaidAmount >= totalAmount ? "PAID" : 
                     newPaidAmount > 0 ? "PARTIAL_PAID" : "SENT";

    // Update invoice
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus
      }
    });

    return NextResponse.json(updatedPayment);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[PAYMENT_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: invoiceId, paymentId } = await params;

    // Get the invoice first to access all payments
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        business: {
          BusinessUserRole: {
            some: {
              userId: session.user.id,
              role: {
                in: ["OWNER", "MANAGER"]
              }
            }
          }
        }
      },
      include: {
        payments: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found or access denied" }, { status: 404 });
    }

    // Find the specific payment
    const payment = invoice.payments.find(p => p.id === paymentId);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found or access denied" }, { status: 404 });
    }

    // Delete the payment
    await db.payment.delete({
      where: { id: paymentId }
    });

    // Recalculate invoice totals
    const remainingPaidAmount = invoice.payments
      .filter((p: any) => p.id !== paymentId)
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    
    const totalAmount = Number(invoice.totalAmount);
    const newStatus = remainingPaidAmount >= totalAmount ? "PAID" : 
                     remainingPaidAmount > 0 ? "PARTIAL_PAID" : "SENT";

    // Update invoice
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: remainingPaidAmount,
        status: newStatus
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[PAYMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}