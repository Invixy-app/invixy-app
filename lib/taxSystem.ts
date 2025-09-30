import prisma from "@/lib/db";
import { Role, TaxType } from "@prisma/client";

export interface TaxSystemData {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  taxId: string;
  taxType: TaxType;
  rate: number;
  isCompound: boolean;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTaxSystemsByBusiness(businessId: string, userId: string): Promise<TaxSystemData[]> {
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

  const taxSystems = await prisma.taxSystem.findMany({
    where: {
      businessId,
      isActive: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  return taxSystems.map(tax => ({
    ...tax,
    rate: Number(tax.rate)
  }));
}

export async function createTaxSystem(
  taxData: Omit<TaxSystemData, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
) {
  // Verify user has permission to create tax systems
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: taxData.businessId
      }
    }
  });

  if (!userRole || (userRole.role !== Role.OWNER && userRole.role !== Role.ACCOUNTANT)) {
    throw new Error("Insufficient permissions. Only owners and accountants can create tax systems.");
  }

  // Check if taxId is unique within the business
  const existingTax = await prisma.taxSystem.findUnique({
    where: {
      businessId_taxId: {
        businessId: taxData.businessId,
        taxId: taxData.taxId
      }
    }
  });

  if (existingTax) {
    throw new Error("Tax ID already exists in this business");
  }

  const taxSystem = await prisma.taxSystem.create({
    data: taxData
  });

  return {
    ...taxSystem,
    rate: Number(taxSystem.rate)
  };
}

export async function updateTaxSystem(
  taxSystemId: string,
  taxData: Partial<Omit<TaxSystemData, 'id' | 'createdAt' | 'updatedAt'>>,
  userId: string
) {
  // Get tax system to verify business ownership
  const taxSystem = await prisma.taxSystem.findUnique({
    where: { id: taxSystemId }
  });

  if (!taxSystem) throw new Error("Tax system not found");

  // Verify user has permission
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: taxSystem.businessId
      }
    }
  });

  if (!userRole || (userRole.role !== Role.OWNER && userRole.role !== Role.ACCOUNTANT)) {
    throw new Error("Insufficient permissions. Only owners and accountants can modify tax systems.");
  }

  const updatedTaxSystem = await prisma.taxSystem.update({
    where: { id: taxSystemId },
    data: taxData
  });

  return {
    ...updatedTaxSystem,
    rate: Number(updatedTaxSystem.rate)
  };
}

export async function calculateTax(
  amount: number,
  taxSystemId: string
): Promise<{ taxAmount: number; totalAmount: number; taxDetails: TaxSystemData }> {
  const taxSystem = await prisma.taxSystem.findUnique({
    where: { id: taxSystemId }
  });

  if (!taxSystem || !taxSystem.isActive) {
    throw new Error("Tax system not found or inactive");
  }

  const rate = Number(taxSystem.rate);
  let taxAmount: number;
  let totalAmount: number;

  switch (taxSystem.taxType) {
    case TaxType.PERCENTAGE:
      taxAmount = amount * rate;
      totalAmount = amount + taxAmount;
      break;
    case TaxType.INCLUSIVE:
      // Tax is included in the amount
      taxAmount = amount - (amount / (1 + rate));
      totalAmount = amount;
      break;
    case TaxType.EXCLUSIVE:
      // Tax is added to the amount
      taxAmount = amount * rate;
      totalAmount = amount + taxAmount;
      break;
    case TaxType.FIXED_AMOUNT:
      taxAmount = rate; // rate represents fixed amount
      totalAmount = amount + taxAmount;
      break;
    case TaxType.COMPOUND:
      // For compound tax, this would need additional logic
      // depending on how compound taxes are applied
      taxAmount = amount * rate;
      totalAmount = amount + taxAmount;
      break;
    default:
      throw new Error("Unsupported tax type");
  }

  return {
    taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
    totalAmount: Math.round(totalAmount * 100) / 100,
    taxDetails: {
      ...taxSystem,
      rate: Number(taxSystem.rate)
    }
  };
}

export async function getTaxSystemByTaxId(businessId: string, taxId: string): Promise<TaxSystemData | null> {
  const taxSystem = await prisma.taxSystem.findUnique({
    where: {
      businessId_taxId: {
        businessId,
        taxId
      }
    }
  });

  if (!taxSystem) return null;

  return {
    ...taxSystem,
    rate: Number(taxSystem.rate)
  };
}

// Predefined tax templates for common tax systems
export const TAX_TEMPLATES = {
  GST_INDIA: {
    name: "GST (India)",
    taxType: TaxType.PERCENTAGE,
    rates: [
      { name: "GST 5%", rate: 0.05, taxId: "GST_5" },
      { name: "GST 12%", rate: 0.12, taxId: "GST_12" },
      { name: "GST 18%", rate: 0.18, taxId: "GST_18" },
      { name: "GST 28%", rate: 0.28, taxId: "GST_28" }
    ]
  },
  VAT_EU: {
    name: "VAT (EU)",
    taxType: TaxType.PERCENTAGE,
    rates: [
      { name: "Standard VAT", rate: 0.20, taxId: "VAT_20" },
      { name: "Reduced VAT", rate: 0.10, taxId: "VAT_10" },
      { name: "Super Reduced VAT", rate: 0.05, taxId: "VAT_5" }
    ]
  },
  SALES_TAX_US: {
    name: "Sales Tax (US)",
    taxType: TaxType.PERCENTAGE,
    rates: [
      { name: "State Tax", rate: 0.06, taxId: "STATE_6" },
      { name: "City Tax", rate: 0.02, taxId: "CITY_2" }
    ]
  }
};