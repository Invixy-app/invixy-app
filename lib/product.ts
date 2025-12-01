import prisma from "@/lib/db";
import { Role, TaxType } from "@prisma/client";

export interface ProductWithTax {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  cost?: number | null;
  category?: string | null;
  unit: string;
  stockQuantity?: number | null;
  minStockLevel?: number | null;
  taxSystemId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  taxSystem?: {
    id: string;
    name: string;
    taxId: string;
    rate: number;
    taxType: TaxType;
  } | null;
}

export async function getProductsByBusiness(businessId: string, userId: string): Promise<ProductWithTax[]> {
  // Verify user has access to this business
  const hasAccess = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId
      }
    }
  });

  if (!hasAccess) throw new Error("Access denied");

  const products = await prisma.product.findMany({
    where: {
      businessId,
      isActive: true
    },
    include: {
      taxSystem: {
        select: {
          id: true,
          name: true,
          taxId: true,
          rate: true,
          taxType: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return products.map(product => ({
    ...product,
    price: Number(product.price),
    cost: product.cost ? Number(product.cost) : null,
    taxSystem: product.taxSystem ? {
      ...product.taxSystem,
      rate: Number(product.taxSystem.rate)
    } : null
  }));
}

export async function createProduct(
  productData: Omit<ProductWithTax, 'id' | 'createdAt' | 'updatedAt' | 'taxSystem'>,
  userId: string
) {
  // Verify user has permission to create products
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: productData.businessId
      }
    }
  });

  if (!userRole || userRole.role === Role.VIEWER) {
    throw new Error("Insufficient permissions");
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      price: productData.price,
      cost: productData.cost
    },
    include: {
      taxSystem: true
    }
  });

  return {
    ...product,
    price: Number(product.price),
    cost: product.cost ? Number(product.cost) : null,
    taxSystem: product.taxSystem ? {
      ...product.taxSystem,
      rate: Number(product.taxSystem.rate)
    } : null
  };
}

export async function updateProduct(
  productId: string,
  productData: Partial<Omit<ProductWithTax, 'id' | 'createdAt' | 'updatedAt' | 'taxSystem'>>,
  userId: string
) {
  // Get product to verify business ownership
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) throw new Error("Product not found");

  // Verify user has permission
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: product.businessId
      }
    }
  });

  if (!userRole || userRole.role === Role.VIEWER) {
    throw new Error("Insufficient permissions");
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: productData,
    include: {
      taxSystem: true
    }
  });

  return {
    ...updatedProduct,
    price: Number(updatedProduct.price),
    cost: updatedProduct.cost ? Number(updatedProduct.cost) : null,
    taxSystem: updatedProduct.taxSystem ? {
      ...updatedProduct.taxSystem,
      rate: Number(updatedProduct.taxSystem.rate)
    } : null
  };
}

export async function updateProductStock(
  productId: string,
  quantity: number,
  operation: 'add' | 'subtract' | 'set',
  userId: string
) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) throw new Error("Product not found");

  // Verify user has permission
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: product.businessId
      }
    }
  });

  if (!userRole || userRole.role === Role.VIEWER) {
    throw new Error("Insufficient permissions");
  }

  // If stock is not tracked (null), do not update
  if (product.stockQuantity === null) {
    return product;
  }

  let newQuantity: number;
  const currentStock = product.stockQuantity;

  switch (operation) {
    case 'add':
      newQuantity = currentStock + quantity;
      break;
    case 'subtract':
      newQuantity = Math.max(0, currentStock - quantity);
      break;
    case 'set':
      newQuantity = Math.max(0, quantity);
      break;
    default:
      throw new Error("Invalid operation");
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: { stockQuantity: newQuantity }
  });

  return updatedProduct;
}