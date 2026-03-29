import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { InvoicePDFService } from "@/lib/pdf-service";
import { EmailService } from "@/lib/email-service";
import db from "@/lib/db";
import { z } from "zod";
import { canSendEmail } from "@/lib/subscription";

const emailSchema = z.object({
  recipient: z.string().email().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional()
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

    const { id } = await params;
    
    // Get the invoice with all related data
    const invoice = await db.invoice.findFirst({
      where: {
        id: id,
        business: {
          BusinessUserRole: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        business: true,
        customer: true,
        // creator: true, // Removed as requested
        items: {
          include: {
            product: true,
            itemTaxes: {
              include: {
                taxSystem: true
              }
            }
          }
        },
        taxes: {
          include: {
            taxSystem: true
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Transform the data for PDF generation
    const invoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() || invoice.issueDate.toISOString(),
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.totalTax),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      currency: invoice.currency,
      notes: invoice.notes || undefined,
      terms: invoice.terms || undefined,
      // salespersonName: invoice.creator?.name || undefined, // Removed as requested
      business: {
        name: invoice.business.name,
        description: invoice.business.description || undefined,
        email: invoice.business.email,
        phone: invoice.business.phone,
        address: invoice.business.billingAddress,
        taxRegistrationNumber: invoice.business.taxRegistrationNumber || undefined
      },
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email || undefined,
        phone: invoice.customer.phone || undefined,
        address: invoice.customer.billingAddress || undefined
      },
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount),
        total: Number(item.lineTotal),
        itemTaxes: item.itemTaxes?.map(tax => ({
          taxRate: Number(tax.taxRate),
          taxAmount: Number(tax.taxAmount)
        })),
        product: item.product ? {
          name: item.product.name,
          sku: item.product.sku || undefined
        } : undefined
      })),
      taxes: invoice.taxes.map(tax => ({
        amount: Number(tax.taxAmount),
        rate: Number(tax.taxRate),
        taxSystem: {
          name: tax.taxSystem.name,
          type: tax.taxSystem.taxType
        }
      })),
      payments: invoice.payments.map(payment => ({
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate.toISOString(),
        paymentMethod: payment.paymentMethod,
        reference: payment.reference || undefined
      }))
    };

    // Generate PDF
    const pdfBuffer = await InvoicePDFService.generateInvoicePDF(invoiceData);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`
      }
    });

  } catch (error) {
    console.error("[INVOICE_PDF_GET]", error);
    return NextResponse.json(
      { error: error },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipient, subject, message, cc, bcc } = emailSchema.parse(body);
    const { id } = await params;

    // Get the invoice with all related data
    const invoice = await db.invoice.findFirst({
      where: {
        id: id,
        business: {
          BusinessUserRole: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        business: true,
        customer: true,
        // creator: true, // Removed as requested
        items: {
          include: {
            product: true,
            itemTaxes: {
              include: {
                taxSystem: true
              }
            }
          }
        },
        taxes: {
          include: {
            taxSystem: true
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const limitCheck = await canSendEmail(invoice.businessId);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    // Check if customer has email
    const emailRecipient = recipient || invoice.customer.email;
    if (!emailRecipient) {
      return NextResponse.json({ 
        error: "No email address available for this customer" 
      }, { status: 400 });
    }

    // Transform the data for PDF generation and email
    const invoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() || invoice.issueDate.toISOString(),
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.totalTax),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      currency: invoice.currency,
      notes: invoice.notes || undefined,
      terms: invoice.terms || undefined,
      // salespersonName: invoice.creator?.name || undefined, // Removed as requested
      business: {
        name: invoice.business.name,
        description: invoice.business.description || undefined,
        email: invoice.business.email,
        phone: invoice.business.phone,
        address: invoice.business.billingAddress,
        taxRegistrationNumber: invoice.business.taxRegistrationNumber || undefined
      },
      customer: {
        name: invoice.customer.name,
        email: emailRecipient,
        phone: invoice.customer.phone || undefined,
        address: invoice.customer.billingAddress || undefined
      },
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        taxAmount: Number(item.taxAmount),
        total: Number(item.lineTotal),
        itemTaxes: item.itemTaxes?.map(tax => ({
          taxRate: Number(tax.taxRate),
          taxAmount: Number(tax.taxAmount)
        })),
        product: item.product ? {
          name: item.product.name,
          sku: item.product.sku || undefined
        } : undefined
      })),
      taxes: invoice.taxes.map(tax => ({
        amount: Number(tax.taxAmount),
        rate: Number(tax.taxRate),
        taxSystem: {
          name: tax.taxSystem.name,
          type: tax.taxSystem.taxType
        }
      })),
      payments: invoice.payments.map(payment => ({
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate.toISOString(),
        paymentMethod: payment.paymentMethod,
        reference: payment.reference || undefined
      }))
    };

    // Generate PDF
    const pdfBuffer = await InvoicePDFService.generateInvoicePDF(invoiceData);

    // Send email
    const emailService = new EmailService();
    const emailSent = await emailService.sendInvoiceEmail(
      invoiceData,
      pdfBuffer,
      {
        subject,
        message,
        cc,
        bcc
      }
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Update invoice status to sent if it was draft
    if (invoice.status === "DRAFT") {
      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "SENT"
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Invoice emailed successfully",
      recipient: emailRecipient
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[INVOICE_EMAIL_POST]", error);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
}
