import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPayPalOrder } from "@/lib/paypal";

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

    // Create PayPal order
    const order = await createPayPalOrder(plan, price, "USD", interval);
    
    // Log the order for debugging
    console.log("PayPal Order Created:", JSON.stringify(order, null, 2));

    // Find the approval URL to redirect the user
    const approveLink = order.links.find((link: any) => link.rel === "approve");

    if (!approveLink) {
      console.error("No approval link in response:", order);
      throw new Error("No approval link found in PayPal response");
    }

    return NextResponse.json({ approvalUrl: approveLink.href });
  } catch (error: any) {
    console.error("PayPal Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
