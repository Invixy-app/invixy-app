import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getTaxSystemsByBusiness, createTaxSystem } from "@/lib/taxSystem";
import { z } from "zod";

import { taxSystemSchema } from "@/lib/validations/tax";

const createTaxSystemSchema = taxSystemSchema.extend({
  businessId: z.string(),
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

    const taxSystems = await getTaxSystemsByBusiness(businessId, session.user.id);
    return NextResponse.json(taxSystems);
  } catch (error: any) {
    console.error("Error fetching tax systems:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tax systems" },
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
    const validatedData = createTaxSystemSchema.parse(body);

    const taxSystem = await createTaxSystem({
      ...validatedData,
      validFrom: validatedData.validFrom || new Date(),
      isActive: true
    }, session.user.id);

    return NextResponse.json(taxSystem, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tax system:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create tax system" },
      { status: 500 }
    );
  }
}