import prisma from "@/lib/db";
import { Role, InvoiceStatus, PaymentMethod } from "@prisma/client";
import { calculateTax } from "./taxSystem";

export interface InvoiceItemData {
  id?: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  sortOrder?: number;
}

export interface InvoiceTaxData {
  taxSystemId: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
}

export interface InvoiceData {
  id: string;
  businessId: string;
  customerId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate?: Date | null;
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string | null;
  terms?: string | null;
  currency: string;
  exchangeRate?: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    billingAddress?: string | null;
  };
  items: InvoiceItemData[];
  taxes: InvoiceTaxData[];
  payments: {
    id: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    reference?: string | null;
  }[];
}

export async function getInvoicesByBusiness(
  businessId: string, 
  userId: string,
  filters?: {
    status?: InvoiceStatus;
    customerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
): Promise<InvoiceData[]> {
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

  const whereClause: any = {
    businessId
  };

  if (filters?.status) whereClause.status = filters.status;
  if (filters?.customerId) whereClause.customerId = filters.customerId;
  if (filters?.dateFrom || filters?.dateTo) {
    whereClause.issueDate = {};
    if (filters.dateFrom) whereClause.issueDate.gte = filters.dateFrom;
    if (filters.dateTo) whereClause.issueDate.lte = filters.dateTo;
  }

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          billingAddress: true
        }
      },
      items: {
        orderBy: { sortOrder: 'asc' }
      },
      taxes: {
        include: {
          taxSystem: {
            select: {
              name: true,
              taxId: true
            }
          }
        }
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          reference: true
        },
        orderBy: { paymentDate: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return invoices.map(invoice => ({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    totalTax: Number(invoice.totalTax),
    totalAmount: Number(invoice.totalAmount),
    paidAmount: Number(invoice.paidAmount),
    exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : null,
    items: invoice.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      lineTotal: Number(item.lineTotal)
    })),
    taxes: invoice.taxes.map(tax => ({
      taxSystemId: tax.taxSystemId,
      taxableAmount: Number(tax.taxableAmount),
      taxRate: Number(tax.taxRate),
      taxAmount: Number(tax.taxAmount)
    })),
    payments: invoice.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  }));
}

export async function getInvoiceById(
  invoiceId: string,
  businessId: string,
  userId: string
): Promise<InvoiceData | null> {
  // Verify user has access to this business
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId
      }
    }
  });

  if (!userRole) {
    throw new Error("Access denied");
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      businessId: businessId
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          billingAddress: true
        }
      },
      items: {
        orderBy: { sortOrder: 'asc' }
      },
      taxes: true,
      payments: {
        orderBy: { paymentDate: 'desc' }
      }
    }
  });

  if (!invoice) {
    return null;
  }

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    totalTax: Number(invoice.totalTax),
    totalAmount: Number(invoice.totalAmount),
    paidAmount: Number(invoice.paidAmount),
    exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : null,
    items: invoice.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      lineTotal: Number(item.lineTotal)
    })),
    taxes: invoice.taxes.map(tax => ({
      taxSystemId: tax.taxSystemId,
      taxableAmount: Number(tax.taxableAmount),
      taxRate: Number(tax.taxRate),
      taxAmount: Number(tax.taxAmount)
    })),
    payments: invoice.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  };
}

export async function createInvoice(
  invoiceData: {
    businessId: string;
    customerId: string;
    issueDate?: Date;
    dueDate?: Date;
    notes?: string;
    terms?: string;
    currency?: string;
    items: Omit<InvoiceItemData, 'id' | 'lineTotal'>[];
  },
  userId: string
): Promise<InvoiceData> {
  // Verify user has permission to create invoices
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: invoiceData.businessId
      }
    }
  });

  if (!userRole || userRole.role === Role.VIEWER) {
    throw new Error("Insufficient permissions");
  }

  // Generate invoice number
  const lastInvoice = await prisma.invoice.findFirst({
    where: { businessId: invoiceData.businessId },
    orderBy: { createdAt: 'desc' }
  });

  const invoiceNumber = generateInvoiceNumber(lastInvoice?.invoiceNumber);

  // Calculate totals
  let subtotal = 0;
  const processedItems = invoiceData.items.map((item, index) => {
    const lineTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
    subtotal += lineTotal;
    return {
      ...item,
      lineTotal,
      sortOrder: index
    };
  });

  // Create invoice with items
  const invoice = await prisma.invoice.create({
    data: {
      businessId: invoiceData.businessId,
      customerId: invoiceData.customerId,
      invoiceNumber,
      status: InvoiceStatus.DRAFT,
      issueDate: invoiceData.issueDate || new Date(),
      dueDate: invoiceData.dueDate,
      subtotal,
      totalTax: 0, // Will be calculated and updated when taxes are applied
      totalAmount: subtotal,
      paidAmount: 0,
      notes: invoiceData.notes,
      terms: invoiceData.terms,
      currency: invoiceData.currency || 'USD',
      createdBy: userId,
      items: {
        create: processedItems
      }
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          billingAddress: true
        }
      },
      items: {
        orderBy: { sortOrder: 'asc' }
      },
      taxes: true,
      payments: true
    }
  });

  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    totalTax: Number(invoice.totalTax),
    totalAmount: Number(invoice.totalAmount),
    paidAmount: Number(invoice.paidAmount),
    exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : null,
    items: invoice.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      lineTotal: Number(item.lineTotal)
    })),
    taxes: [],
    payments: []
  };
}

export async function applyTaxesToInvoice(
  invoiceId: string,
  taxSystemIds: string[],
  userId: string
): Promise<InvoiceData> {
  // Get invoice with items
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      taxes: true
    }
  });

  if (!invoice) throw new Error("Invoice not found");

  // Verify user has permission
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: invoice.businessId
      }
    }
  });

  if (!userRole || (userRole.role !== Role.OWNER && userRole.role !== Role.ACCOUNTANT && userRole.role !== Role.MANAGER)) {
    throw new Error("Insufficient permissions to apply taxes");
  }

  // Clear existing taxes
  await prisma.invoiceTax.deleteMany({
    where: { invoiceId }
  });

  // Calculate and apply new taxes
  const subtotal = Number(invoice.subtotal);
  let totalTax = 0;
  const taxesToCreate = [];

  for (const taxSystemId of taxSystemIds) {
    const taxCalculation = await calculateTax(subtotal, taxSystemId);
    totalTax += taxCalculation.taxAmount;
    
    taxesToCreate.push({
      invoiceId,
      taxSystemId,
      taxableAmount: subtotal,
      taxRate: taxCalculation.taxDetails.rate,
      taxAmount: taxCalculation.taxAmount
    });
  }

  // Create new tax records
  await prisma.invoiceTax.createMany({
    data: taxesToCreate
  });

  // Update invoice totals
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      totalTax,
      totalAmount: subtotal + totalTax
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          billingAddress: true
        }
      },
      items: {
        orderBy: { sortOrder: 'asc' }
      },
      taxes: true,
      payments: true
    }
  });

  return {
    ...updatedInvoice,
    subtotal: Number(updatedInvoice.subtotal),
    totalTax: Number(updatedInvoice.totalTax),
    totalAmount: Number(updatedInvoice.totalAmount),
    paidAmount: Number(updatedInvoice.paidAmount),
    exchangeRate: updatedInvoice.exchangeRate ? Number(updatedInvoice.exchangeRate) : null,
    items: updatedInvoice.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      lineTotal: Number(item.lineTotal)
    })),
    taxes: updatedInvoice.taxes.map(tax => ({
      taxSystemId: tax.taxSystemId,
      taxableAmount: Number(tax.taxableAmount),
      taxRate: Number(tax.taxRate),
      taxAmount: Number(tax.taxAmount)
    })),
    payments: updatedInvoice.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  };
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  userId: string
): Promise<InvoiceData> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  if (!invoice) throw new Error("Invoice not found");

  // Verify user has permission
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: invoice.businessId
      }
    }
  });

  if (!userRole || userRole.role === Role.VIEWER) {
    throw new Error("Insufficient permissions");
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          billingAddress: true
        }
      },
      items: {
        orderBy: { sortOrder: 'asc' }
      },
      taxes: true,
      payments: true
    }
  });

  return {
    ...updatedInvoice,
    subtotal: Number(updatedInvoice.subtotal),
    totalTax: Number(updatedInvoice.totalTax),
    totalAmount: Number(updatedInvoice.totalAmount),
    paidAmount: Number(updatedInvoice.paidAmount),
    exchangeRate: updatedInvoice.exchangeRate ? Number(updatedInvoice.exchangeRate) : null,
    items: updatedInvoice.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      lineTotal: Number(item.lineTotal)
    })),
    taxes: updatedInvoice.taxes.map(tax => ({
      taxSystemId: tax.taxSystemId,
      taxableAmount: Number(tax.taxableAmount),
      taxRate: Number(tax.taxRate),
      taxAmount: Number(tax.taxAmount)
    })),
    payments: updatedInvoice.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  };
}

export async function recordPayment(
  invoiceId: string,
  paymentData: {
    amount: number;
    paymentDate?: Date;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
  },
  userId: string
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  if (!invoice) throw new Error("Invoice not found");

  // Verify user has permission
  const userRole = await prisma.businessUserRole.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId: invoice.businessId
      }
    }
  });

  if (!userRole || userRole.role === Role.VIEWER) {
    throw new Error("Insufficient permissions");
  }

  const totalAmount = Number(invoice.totalAmount);
  const currentPaid = Number(invoice.paidAmount);
  const newPaidAmount = currentPaid + paymentData.amount;

  if (newPaidAmount > totalAmount) {
    throw new Error("Payment amount exceeds invoice total");
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate || new Date(),
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference,
      notes: paymentData.notes,
      createdBy: userId
    }
  });

  // Update invoice paid amount and status
  let newStatus = invoice.status;
  if (newPaidAmount >= totalAmount) {
    newStatus = InvoiceStatus.PAID;
  } else if (newPaidAmount > 0) {
    newStatus = InvoiceStatus.PARTIAL_PAID;
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus
    }
  });

  return payment;
}

function generateInvoiceNumber(lastInvoiceNumber?: string): string {
  const prefix = "INV";
  const currentYear = new Date().getFullYear();
  
  if (!lastInvoiceNumber) {
    return `${prefix}-${currentYear}-0001`;
  }

  // Extract number from last invoice
  const parts = lastInvoiceNumber.split('-');
  if (parts.length === 3 && parts[1] === currentYear.toString()) {
    const lastNumber = parseInt(parts[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${prefix}-${currentYear}-${nextNumber}`;
  }

  // New year or different format, start from 0001
  return `${prefix}-${currentYear}-0001`;
}