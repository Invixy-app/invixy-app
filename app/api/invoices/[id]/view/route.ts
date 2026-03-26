import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // No status transition on view: statuses are limited to DRAFT, SENT, PAID, CANCELLED.

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[INVOICE_VIEW_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
