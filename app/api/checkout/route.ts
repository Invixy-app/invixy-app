import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getPrice } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan, interval, currency } = await req.json();

    // Basic validation
    if (!plan || !interval ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get validated price from backend config
    const price = getPrice(currency, plan, interval);

    if (price === 0) {
       return NextResponse.json({ error: "Free plans do not require payment" }, { status: 400 });
    }

    // Create Razorpay order
    // Using provided currency or default to INR
    const receipt = `receipt_1`;
    const order = await createRazorpayOrder(price, currency || "INR", receipt);
    
    // Log the order for debugging
    console.log("Razorpay Order Created:", JSON.stringify(order, null, 2));

    return NextResponse.json({ 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Razorpay Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
