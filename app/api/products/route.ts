import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getProductsByBusiness, createProduct } from "@/lib/product";
import { z } from "zod";
import { checkProductLimit } from "@/lib/subscription";

import { productSchema } from "@/lib/validations/product";

const createProductSchema = productSchema.extend({
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
    const taxSystemId = searchParams.get("taxSystemId") || undefined;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const products = await getProductsByBusiness(businessId, session.user.id, taxSystemId);
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
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

    // Sanitize input
    if (body.taxSystemId === "" || body.taxSystemId === "none" || body.taxSystemId === null) {
      delete body.taxSystemId;
    }
    if (body.stockQuantity === "" || body.stockQuantity === null) {
      delete body.stockQuantity;
    }

    const validatedData = createProductSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error },
        { status: 400 }
      );
    }

    const limitCheck = await checkProductLimit(validatedData.data.businessId);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const product = await createProduct({
      ...validatedData.data,
      isActive: true
    }, session.user.id);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}