import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { InvoicePDFService } from "@/lib/pdf-service";
import { EmailService } from "@/lib/email-service";
import db from "@/lib/db";
import { z } from "zod";
import { canSendEmail } from "@/lib/subscription";

const bulkEmailSchema = z.object({
  invoiceIds: z.array(z.string()).min(1, "At least one invoice ID is required"),
  subject: z.string().optional(),
  message: z.string().optional(),
  bcc: z.array(z.string().email()).optional(),
  delayBetweenEmails: z.number().min(0).max(30000).optional() // Max 30 seconds delay
});

const normalizeCurrency = (currency?: string | null) =>
  String(currency || "USD").trim().toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceIds, subject, message, bcc, delayBetweenEmails } = bulkEmailSchema.parse(body);

    // Get all invoices with access verification
    const invoices = await db.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        business: {
          BusinessUserRole: {
            some: {
              userId: session.user.id,
              role: {
                in: ["OWNER", "MANAGER"]
              }
            }
          }
        }
      },
      include: {
        business: true,
        customer: true,
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

    if (invoices.length === 0) {
      return NextResponse.json({ 
        error: "No invoices found or access denied" 
      }, { status: 404 });
    }

    // Check subscription limits
    const businessIds = [...new Set(invoices.map(inv => inv.businessId))];
    for (const bid of businessIds) {
        const limitCheck = await canSendEmail(bid);
        if (!limitCheck.allowed) {
             return NextResponse.json({ error: limitCheck.message }, { status: 403 });
        }
    }

    // Filter out invoices without customer emails
    const validInvoices = invoices.filter(invoice => invoice.customer.email);
    const skippedInvoices = invoices.filter(invoice => !invoice.customer.email);

    if (validInvoices.length === 0) {
      return NextResponse.json({ 
        error: "No invoices with valid customer email addresses found" 
      }, { status: 400 });
    }

    // Prepare email data for each invoice
    const emailData = await Promise.all(
      validInvoices.map(async (invoice) => {
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
          currency: normalizeCurrency(invoice.currency),
          notes: invoice.notes || undefined,
          terms: invoice.terms || undefined,
          business: {
            name: invoice.business.name,
            description: invoice.business.description || undefined,
            email: invoice.business.email,
            phone: invoice.business.phone,
            address: invoice.business.billingAddress,
            taxRegistrationNumber: invoice.business.taxRegistrationNumber || undefined,
            invoiceTemplate: invoice.business.invoiceTemplate || undefined
          },
          customer: {
            name: invoice.customer.name,
            email: invoice.customer.email!,
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
              taxAmount: Number(tax.taxAmount),
              taxSystem: {
                name: tax.taxSystem.name,
                taxType: tax.taxSystem.taxType,
              },
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
              taxType: tax.taxSystem.taxType
            }
          })),
          payments: invoice.payments.map(payment => ({
            amount: Number(payment.amount),
            paymentDate: payment.paymentDate.toISOString(),
            paymentMethod: payment.paymentMethod,
            reference: payment.reference || undefined
          }))
        };

        // Generate PDF for this invoice
        const pdfBuffer = await InvoicePDFService.generateInvoicePDF(invoiceData);

        return {
          invoice: invoiceData,
          pdfAttachment: pdfBuffer,
          customMessage: message
        };
      })
    );

    // Send bulk emails
    const emailService = new EmailService();
    const results = await emailService.sendBulkInvoiceEmails(emailData, {
      bcc,
      delayBetweenEmails
    });

    // Update sent invoices status
    const successfulInvoiceIds = results.results
      .filter(result => result.success)
      .map(result => result.invoiceId);

    if (successfulInvoiceIds.length > 0) {
      await db.invoice.updateMany({
        where: {
          id: { in: successfulInvoiceIds },
          status: "DRAFT"
        },
        data: {
          status: "SENT"
        }
      });
    }

    return NextResponse.json({
      success: true,
      totalRequested: invoiceIds.length,
      totalProcessed: validInvoices.length,
      sent: results.sent,
      failed: results.failed,
      skippedInvoices: skippedInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.name,
        reason: "No email address"
      })),
      results: results.results
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[BULK_EMAIL_POST]", error);
    return NextResponse.json(
      { error: "Failed to send bulk emails" },
      { status: 500 }
    );
  }
}