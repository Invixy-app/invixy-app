import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";
import { z } from "zod";

const updateProductSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  unitPrice: z.number().min(0, "Unit price must be non-negative").optional(),
  costPrice: z.number().min(0, "Cost price must be non-negative").optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity must be non-negative").optional(),
  minStockLevel: z.number().int().min(0, "Minimum stock level must be non-negative").optional(),
  unit: z.string().optional(),
  taxable: z.boolean().optional(),
  active: z.boolean().optional(),
  notes: z.string().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Verify user has access to this business
    const userRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      }
    });

    const { id } = await params;
    if (!userRole) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: id,
        businessId: businessId
      },
      include: {
        _count: {
          select: {
            invoiceItems: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      stockQuantity: product.stockQuantity || 0,
      minStockLevel: product.minStockLevel || 0
    });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, ...updateData } = updateProductSchema.parse(body);

    // Verify user has access to this business
    const userRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      }
    });

    if (!userRole || userRole.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    // Check if product exists and belongs to the business
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: id,
        businessId: businessId
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check for duplicate SKU if SKU is being updated
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findFirst({
        where: {
          businessId: businessId,
          sku: updateData.sku,
          id: { not: id }
        }
      });

      if (existingSku) {
        return NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      ...updatedProduct,
      stockQuantity: updatedProduct.stockQuantity || 0,
      minStockLevel: updatedProduct.minStockLevel || 0
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Verify user has access to this business
    const userRole = await prisma.businessUserRole.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId
        }
      }
    });

    if (!userRole || userRole.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    // Check if product exists and belongs to the business
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: id,
        businessId: businessId
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product is used in invoice items
    const invoiceItemCount = await prisma.invoiceItem.count({
      where: { productId: id }
    });

    if (invoiceItemCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete product that has been used in invoices. Consider marking it as inactive instead." },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}