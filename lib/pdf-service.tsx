import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDFTemplate from './invoice-pdf-template';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes?: string;
  terms?: string;
  business: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
  };
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxAmount: number;
    total: number;
    itemTaxes?: Array<{
      taxRate: number;
      taxAmount: number;
    }>;
    product?: {
      name: string;
      sku?: string;
    };
  }>;
  taxes: Array<{
    amount: number;
    rate: number;
    taxSystem: {
      name: string;
      type: string;
    };
  }>;
  payments: Array<{
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
  }>;
}

export class InvoicePDFService {
  static async generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
    try {
      const pdfDocument = <InvoicePDFTemplate invoice={invoice} />;
      const buffer = await renderToBuffer(pdfDocument);
      return buffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateMultipleInvoicesPDF(invoices: InvoiceData[]): Promise<Buffer> {
    try {
      if (invoices.length === 0) {
        throw new Error('No invoices provided');
      }
      // For now, just generate the first invoice
      // You can enhance this to combine multiple invoices
      const pdfDocument = <InvoicePDFTemplate invoice={invoices[0]} />;
      const buffer = await renderToBuffer(pdfDocument);
      return buffer;
    } catch (error) {
      console.error('Error generating batch PDF:', error);
      throw new Error(`Failed to generate batch PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
