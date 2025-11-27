import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {  requireAuth } from "@/lib/auth";
import { capturePayPalPayment } from "@/lib/paypal";
import  prisma  from "@/lib/db";
import { Plan, PlanInterval, SubscriptionStatus, TransactionStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token"); // This is the Order ID from PayPal

  if (!session || !token) {
    return NextResponse.redirect(new URL("/?error=payment_failed_unauthorized", req.url));
  }

  try {
    // 1. Capture the payment
    const captureData = await capturePayPalPayment(token);

    if (captureData.status === "COMPLETED") {
      const purchaseUnit = captureData.purchase_units[0];
      const capture = purchaseUnit.payments.captures[0];
      const { amount } = capture;
      
      // Extract metadata we sent during creation (or parse description)
      // Note: PayPal sometimes puts custom_id in the purchase_unit
      let plan: Plan = "PRO";
      let interval: PlanInterval = "MONTHLY";
      
      try {
        if (purchaseUnit.custom_id) {
          const metadata = JSON.parse(purchaseUnit.custom_id);
          plan = metadata.plan as Plan;
          interval = metadata.interval as PlanInterval;
        }
      } catch (e) {
        console.warn("Failed to parse custom_id, falling back to defaults or description parsing", e);
        // Fallback parsing if custom_id fails
        const desc = purchaseUnit.description || "";
        if (desc.includes("ENTERPRISE")) plan = "ENTERPRISE";
        if (desc.includes("YEARLY")) interval = "YEARLY";
        else if (desc.includes("QUARTERLY")) interval = "QUARTERLY";
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

      // 3. Calculate Subscription Dates
      const startDate = new Date();
      const endDate = new Date();
      if (interval === "MONTHLY") endDate.setMonth(endDate.getMonth() + 1);
      else if (interval === "QUARTERLY") endDate.setMonth(endDate.getMonth() + 3);
      else if (interval === "YEARLY") endDate.setFullYear(endDate.getFullYear() + 1);

      // 4. Database Transaction
      await prisma.$transaction(async (tx) => {
        // A. Record the Transaction
        await tx.transaction.create({
          data: {
            businessId: businessRole.businessId,
            amount: amount.value,
            currency: amount.currency_code,
            status: TransactionStatus.COMPLETED,
            plan,
            interval,
            paymentMethod: "PAYPAL",
            paypalOrderId: captureData.id,
            paypalPayerId: captureData.payer?.payer_id,
            paymentEmail: captureData.payer?.email_address,
            // PayPal doesn't always return card digits in the standard capture response 
            // unless a card was used directly. We'll leave it null or extract if available.
            last4Digits: null 
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
            plan,
            interval,
            status: SubscriptionStatus.ACTIVE,
            startDate,
            endDate,
            paypalSubscriptionId: captureData.id // Storing order ID as sub ID for one-time payments
          }
        });
      });

      // Redirect to dashboard with success message
      return NextResponse.redirect(new URL("/dashboard?payment=success", req.url));
    }
  } catch (error) {
    console.error("Payment Capture Error:", error);
    return NextResponse.redirect(new URL("/?error=payment_processing_error", req.url));
  }
}
