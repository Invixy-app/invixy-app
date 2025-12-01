import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyRazorpaySignature, razorpay } from "@/lib/razorpay";
import prisma from "@/lib/db";
import { Plan, PlanInterval, SubscriptionStatus, TransactionStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      plan,
      interval 
    } = await req.json();

    // 1. Verify Signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return NextResponse.json(
        { status: 'failure', message: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 2. Find the User's Business (Owner role)
    const businessRole = await prisma.businessUserRole.findFirst({
      where: { 
        userId: session.user.id, 
        role: "OWNER" 
      },
      include: { business: true }
    });

    if (!businessRole) {
      throw new Error("No business found for this user");
    }

    // 3. Fetch payment details from Razorpay to get the amount
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const amount = Number(order.amount) / 100; // Convert from paise to main unit

    // 4. Calculate Subscription Dates
    const startDate = new Date();
    const endDate = new Date();
    if (interval === "MONTHLY") endDate.setMonth(endDate.getMonth() + 1);
    else if (interval === "QUARTERLY") endDate.setMonth(endDate.getMonth() + 3);
    else if (interval === "YEARLY") endDate.setFullYear(endDate.getFullYear() + 1);

    // 5. Database Transaction
    await prisma.$transaction(async (tx) => {
      // A. Record the Transaction
      const transaction = await tx.transaction.create({
        data: {
          businessId: businessRole.businessId,
          amount: amount,
          currency: order.currency,
          status: TransactionStatus.COMPLETED,
          plan: plan as Plan,
          interval: interval as PlanInterval,
          paymentMethod: "RAZORPAY",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paymentEmail: session.user.email,
        }
      });

      // B. Expire old active subscriptions
      await tx.subscription.updateMany({
        where: { 
          businessId: businessRole.businessId, 
          status: SubscriptionStatus.ACTIVE 
        },
        data: { status: SubscriptionStatus.EXPIRED }
      });

      // C. Create new active subscription
      await tx.subscription.create({
        data: {
          businessId: businessRole.businessId,
          plan: plan as Plan,
          interval: interval as PlanInterval,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
          transactionId: transaction.id
        }
      });
    });

    return NextResponse.json({ status: 'success', message: 'Payment verified' });

  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
