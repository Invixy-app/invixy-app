import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan, interval, price } = await req.json();

    // Basic validation
    if (!plan || !interval ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    // Using INR as default currency as per schema change
    const receipt = `receipt_1`;
    const order = await createRazorpayOrder(price, "INR", receipt);
    
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
