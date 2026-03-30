import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getProductsByBusiness, createProduct } from "@/lib/product";
import { z } from "zod";
import { checkProductLimit } from "@/lib/subscription";
import db from "@/lib/db";

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
    const paginated = searchParams.get("paginated") === "true";

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    if (!paginated) {
      const products = await getProductsByBusiness(businessId, session.user.id, taxSystemId);
      return NextResponse.json(products);
    }

    const access = await db.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
    });

    if (!access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "10")));
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();

    const whereClause: any = {
      businessId,
      isActive: true,
    };

    if (taxSystemId) {
      whereClause.taxSystemId = taxSystemId;
    }

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [itemsRaw, total, activeCount, lowStockRows, categoryRows] = await Promise.all([
      db.product.findMany({
        where: whereClause,
        include: {
          taxSystem: {
            select: {
              id: true,
              name: true,
              taxId: true,
              rate: true,
              taxType: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product.count({ where: whereClause }),
      db.product.count({ where: { businessId, isActive: true } }),
      db.product.findMany({
        where: {
          businessId,
          isActive: true,
          stockQuantity: { not: null },
          minStockLevel: { not: null },
        },
        select: {
          stockQuantity: true,
          minStockLevel: true,
        },
      }),
      db.product.findMany({
        where: { businessId, isActive: true, category: { not: null } },
        select: { category: true },
        distinct: ["category"],
      }),
    ]);

    const items = itemsRaw.map((product) => ({
      ...product,
      price: Number(product.price),
      cost: product.cost ? Number(product.cost) : null,
      taxSystem: product.taxSystem
        ? {
            ...product.taxSystem,
            rate: Number(product.taxSystem.rate),
          }
        : null,
    }));

    const lowStockCount = lowStockRows.filter(
      (row) =>
        typeof row.stockQuantity === "number" &&
        typeof row.minStockLevel === "number" &&
        row.stockQuantity <= row.minStockLevel
    ).length;

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages,
      categoryOptions: categoryRows.map((row) => row.category).filter(Boolean),
      stats: {
        activeCount,
        lowStockCount,
        categoryCount: categoryRows.length,
      },
    });
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