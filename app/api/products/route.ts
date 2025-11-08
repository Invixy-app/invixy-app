import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getProductsByBusiness, createProduct } from "@/lib/product";
import { z } from "zod";

const createProductSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  cost: z.coerce.number().min(0).nullable().transform(val => val ?? undefined),
  category: z.string().optional(),
  unit: z.string().default("pcs"),
  stockQuantity: z.coerce.number().int().nullable().transform(val => val ?? undefined),
  minStockLevel: z.coerce.number().int().nullable().transform(val => val ?? undefined),
  taxSystemId: z.string().nullable().transform(val => val === "none" || !val ? undefined : val)
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

    const products = await getProductsByBusiness(businessId, session.user.id);
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
    const validatedData = createProductSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error },
        { status: 400 }
      );
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