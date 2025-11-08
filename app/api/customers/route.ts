import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getCustomersByBusiness, createCustomer } from "@/lib/customer";
import { z } from "zod";
import { authOptions } from "@/lib/auth-config";

const createCustomerSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const customers = await getCustomersByBusiness(businessId, session.user.id);
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
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
    const validatedData = createCustomerSchema.parse(body);

    const customer = await createCustomer({
      ...validatedData,
      email: validatedData.email || null,
      isActive: true
    }, session.user.id);

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}