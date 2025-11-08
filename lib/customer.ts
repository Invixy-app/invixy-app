import prisma from "@/lib/db";
import { Role } from "@prisma/client";

export interface CustomerWithBusiness {
  id: string;
  businessId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  taxId?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCustomersByBusiness(businessId: string, userId: string): Promise<CustomerWithBusiness[]> {
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

  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      isActive: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return customers;
}

export async function createCustomer(
  customerData: Omit<CustomerWithBusiness, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
) {
  // Verify user has permission to create customers
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: customerData.businessId
      }
    }
  });

  if (!userRole || userRole.role === Role.VIEWER) {
    throw new Error("Insufficient permissions");
  }

  const customer = await prisma.customer.create({
    data: customerData
  });

  return customer;
}

export async function updateCustomer(
  customerId: string,
  customerData: Partial<CustomerWithBusiness>,
  userId: string
) {
  // Get customer to verify business ownership
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });

  if (!customer) throw new Error("Customer not found");

  // Verify user has permission
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: customer.businessId
      }
    }
  });

  if (!userRole || userRole.role === Role.VIEWER) {
    throw new Error("Insufficient permissions");
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: customerData
  });

  return updatedCustomer;
}

export async function deleteCustomer(customerId: string, userId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });

  if (!customer) throw new Error("Customer not found");

  // Verify user has permission (only OWNER can delete)
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: customer.businessId
      }
    }
  });

  if (!userRole || userRole.role !== Role.OWNER) {
    throw new Error("Only business owners can delete customers");
  }

  // Soft delete by setting isActive to false
  const deletedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: false }
  });

  return deletedCustomer;
}