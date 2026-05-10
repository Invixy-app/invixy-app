import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDFTemplate from '@/lib/invoice-pdf-template';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const template = searchParams.get('template') || 'TEMPLATE_1';

    const dummyInvoice = {
      id: 'INV-PREVIEW-001',
      invoiceNumber: 'INV-2024-001',
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ISSUED',
      subtotal: 5000,
      taxAmount: 900,
      totalAmount: 5900,
      paidAmount: 0,
      currency: 'INR',
      notes: 'Thank you for your business! This is a preview template.',
      terms: 'Net 15 Days',
      business: {
        name: 'Your Company Ltd.',
        description: 'Software Development & Consulting',
        email: 'contact@yourcompany.com',
        phone: '+91 9876543210',
        address: '123 Tech Park, Bangalore, Karnataka, 560001',
        taxRegistrationNumber: '29AAACG1234D1Z2',
        invoiceTemplate: template
      },
      customer: {
        id: 'CUST-001',
        name: 'Client Enterprises',
        email: 'billing@cliententerprises.com',
        phone: '+91 1234567890',
        address: '456 Commercial Street, Mumbai, Maharashtra, 400001'
      },
      items: [
        {
          description: 'Software Licensing Fee',
          quantity: 2,
          unitPrice: 1500,
          discount: 0,
          taxAmount: 540,
          total: 3000,
          product: { name: 'Pro License', sku: '997331' },
          itemTaxes: [
            { taxRate: 0.18, taxAmount: 540, taxSystem: { name: 'IGST' } }
          ]
        },
        {
          description: 'Consulting Services',
          quantity: 1,
          unitPrice: 2000,
          discount: 0,
          taxAmount: 360,
          total: 2000,
          product: { name: 'Consulting', sku: '998311' },
          itemTaxes: [
            { taxRate: 0.18, taxAmount: 360, taxSystem: { name: 'IGST' } }
          ]
        }
      ],
      taxes: [
        {
          amount: 900,
          rate: 0.18,
          taxSystem: { name: 'IGST' }
        }
      ],
      payments: []
    };

    const buffer = await renderToBuffer(<InvoicePDFTemplate invoice={dummyInvoice as any} />);

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="template-preview.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating preview PDF:', error);
    return NextResponse.json({ error: 'Failed to generate preview PDF' }, { status: 500 });
  }
}
