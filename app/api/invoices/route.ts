import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getInvoicesByBusiness, createInvoice } from "@/lib/invoice";
import { InvoiceStatus } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth-config";
import { checkInvoiceLimit } from "@/lib/subscription";

import { invoiceSchema } from "@/lib/validations/invoice";

const createInvoiceSchema = invoiceSchema.and(z.object({
  businessId: z.string(),
}));

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status") as InvoiceStatus | null;
    const customerId = searchParams.get("customerId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    const invoices = await getInvoicesByBusiness(businessId, session.user.id, filters);
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    const limitCheck = await checkInvoiceLimit(validatedData.businessId);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const invoice = await createInvoice(validatedData, session.user.id);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}