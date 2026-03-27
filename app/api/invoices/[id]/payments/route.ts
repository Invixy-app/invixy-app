import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import db from "@/lib/db";
import { z } from "zod";
import { authOptions } from "@/lib/auth-config";

const paymentSchema = z.object({
  amount: z.number().min(0.01),
  paymentDate: z.string().transform((str) => new Date(str)),
  method: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "CHECK", "OTHER"]),
  reference: z.string().optional(),
  notes: z.string().optional()
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
    const validatedData = paymentSchema.parse(body);

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
        payments: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Calculate current paid amount (convert Decimal to number)
    const currentPaidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalAmount = Number(invoice.totalAmount);
    const remainingBalance = totalAmount - currentPaidAmount;

    // Validate payment amount
    if (validatedData.amount > remainingBalance) {
      return NextResponse.json(
        { error: "Payment amount exceeds remaining balance" },
        { status: 400 }
      );
    }

    // Create the payment
    const payment = await db.payment.create({
      data: {
        invoiceId: id,
        amount: validatedData.amount,
        paymentDate: validatedData.paymentDate,
        paymentMethod: validatedData.method,
        reference: validatedData.reference,
        notes: validatedData.notes,
        createdBy: session.user.id
      }
    });

    // Calculate new totals
    const newPaidAmount = currentPaidAmount + validatedData.amount;
    const newStatus = newPaidAmount >= totalAmount ? "PAID" : "SENT";

    // Update invoice status and paid amount
    const updatedInvoice = await db.invoice.update({
      where: { id: id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus
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
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    });

    return NextResponse.json({
      payment,
      invoice: updatedInvoice
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[INVOICE_PAYMENT_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}