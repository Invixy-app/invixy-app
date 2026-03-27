import prisma from "@/lib/db";
import { Role, Plan, InvoiceTemplate } from "@prisma/client";

export interface BusinessWithRole {
  id: string;
  name: string;
  description: string | null;
  billingAddress: string;
  shippingAddress: string;
  taxRegistrationNumber: string | null;
  phone: string;
  email: string;
  website: string | null;
  logo: string | null;
  currency: string;
  timezone: string;
  invoiceTemplate: InvoiceTemplate;
  isActive: boolean;
  role: Role;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserBusinessesWithRoles(userId: string): Promise<BusinessWithRole[]> {
  const businessRoles = await prisma.businessUserRole.findMany({
    where: { userId },
    include: {
      business: {
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    }
  });

  return businessRoles.map(br => ({
    ...br.business,
    role: br.role,
    plan: br.business.subscriptions[0]?.plan || "FREE",
    subscriptions: undefined // Remove subscriptions from the returned object to match interface
  }));
}

export async function getBusinessById(businessId: string, userId: string): Promise<BusinessWithRole | null> {
  const businessRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId
      }
    },
    include: {
      business: {
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    }
  });

  if (!businessRole) return null;

  return {
    ...businessRole.business,
    role: businessRole.role,
    plan: businessRole.business.subscriptions[0]?.plan || "FREE",
  };
}

export async function createBusinessWithOwner(
  businessData: any,
  userId: string
) {
  const business = await prisma.business.create({
    data: {
      ...businessData,
      BusinessUserRole: {
        create: {
          userId,
          role: Role.OWNER
        }
      }
    },
    include: {
      BusinessUserRole: true
    }
  });

  return business;
}

export async function switchUserBusiness(userId: string, businessId: string) {
  // Verify user has access to this business
  const businessAccess = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId
      }
    },
    include: {
      business: true
    }
  });

  return businessAccess;
}

export const CURRENCY_OPTIONS = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
];

export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/London", label: "GMT" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Asia/Tokyo", label: "Japan Standard Time" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
];