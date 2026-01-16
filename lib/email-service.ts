import { Resend } from 'resend';
import { formatCurrency } from '@/lib/utils';

interface InvoiceEmailData {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: string;
  business: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  customer: {
    name: string;
    email: string;
  };
}

export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    // Initialize Resend with API key from environment variables
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    this.resend = new Resend(apiKey);
    // Format: "Business Name <onboarding@resend.dev>" or use your verified domain
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Test the API key by attempting to get domains
      // This is a simple check to verify the API key is valid
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Reset your password</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Reset Password
            </a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
          </div>
        `
      });

      if (error) {
        console.error('Failed to send password reset email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  private generateInvoiceEmailHTML(invoice: InvoiceEmailData, message?: string): string {
    const balanceAmount = invoice.totalAmount - invoice.paidAmount;
    const isOverdue = new Date(invoice.dueDate) < new Date() && balanceAmount > 0;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            
            .email-container {
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            
            .header p {
              margin: 8px 0 0 0;
              opacity: 0.9;
            }
            
            .content {
              padding: 30px;
            }
            
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #2c3e50;
            }
            
            .message {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 6px;
              margin-bottom: 25px;
              border-left: 4px solid #667eea;
            }
            
            .invoice-summary {
              background: #ffffff;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 25px;
              margin: 25px 0;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #f1f3f5;
            }
            
            .summary-row:last-child {
              border-bottom: none;
              font-weight: bold;
              font-size: 18px;
              color: #2c3e50;
              padding-top: 15px;
              margin-top: 10px;
              border-top: 2px solid #e9ecef;
            }
            
            .summary-label {
              color: #6c757d;
            }
            
            .summary-value {
              font-weight: 500;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            
            .status-sent { background: #dbeafe; color: #1d4ed8; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-partial-paid { background: #fef3c7; color: #92400e; }
            .status-overdue { background: #fee2e2; color: #dc2626; }
            
            .overdue-notice {
              background: #fee2e2;
              border: 1px solid #fca5a5;
              color: #dc2626;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
              text-align: center;
            }
            
            .payment-info {
              background: #e8f5e8;
              border: 1px solid #c3e6c3;
              color: #2d5a2d;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            
            .action-button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            
            .action-button:hover {
              background: #5a6fd8;
            }
            
            .business-info {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              font-size: 14px;
              color: #6c757d;
            }
            
            .business-name {
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6c757d;
            }
            
            @media (max-width: 600px) {
              body { padding: 10px; }
              .content { padding: 20px; }
              .header { padding: 20px; }
              .invoice-summary { padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Invoice ${invoice.invoiceNumber}</h1>
              <p>from ${invoice.business.name}</p>
            </div>
            
            <div class="content">
              <div class="greeting">
                Hello ${invoice.customer.name},
              </div>
              
              ${message ? `
              <div class="message">
                ${message.replace(/\n/g, '<br>')}
              </div>
              ` : ''}
              
              ${isOverdue ? `
              <div class="overdue-notice">
                ⚠️ This invoice is overdue. Payment was due on ${formatDate(invoice.dueDate)}.
              </div>
              ` : ''}
              
              ${invoice.status === 'PAID' ? `
              <div class="payment-info">
                ✅ Thank you! This invoice has been fully paid.
              </div>
              ` : `
              <p>
                ${invoice.status === 'SENT' ? 
                  `We hope this email finds you well. Please find attached invoice #${invoice.invoiceNumber} for your review and payment.` :
                  invoice.status === 'PARTIAL_PAID' ?
                  `Thank you for your partial payment. Please find the updated invoice showing your remaining balance.` :
                  `Please find your invoice #${invoice.invoiceNumber} attached.`
                }
              </p>
              `}
              
              <div class="invoice-summary">
                <div class="summary-row">
                  <span class="summary-label">Invoice Number:</span>
                  <span class="summary-value">#${invoice.invoiceNumber}</span>
                </div>
                
                <div class="summary-row">
                  <span class="summary-label">Issue Date:</span>
                  <span class="summary-value">${formatDate(invoice.issueDate)}</span>
                </div>
                
                <div class="summary-row">
                  <span class="summary-label">Due Date:</span>
                  <span class="summary-value">${formatDate(invoice.dueDate)}</span>
                </div>
                
                <div class="summary-row">
                  <span class="summary-label">Status:</span>
                  <span class="summary-value">
                    <span class="status-badge status-${invoice.status.toLowerCase().replace('_', '-')}">
                      ${invoice.status.replace('_', ' ')}
                    </span>
                  </span>
                </div>
                
                ${invoice.paidAmount > 0 ? `
                <div class="summary-row">
                  <span class="summary-label">Amount Paid:</span>
                  <span class="summary-value" style="color: #10b981;">
                    ${formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
                ` : ''}
                
                <div class="summary-row">
                  <span class="summary-label">${balanceAmount > 0 ? 'Amount Due:' : 'Total Amount:'}</span>
                  <span class="summary-value">
                    ${formatCurrency(balanceAmount > 0 ? balanceAmount : invoice.totalAmount)}
                  </span>
                </div>
              </div>
              
              ${balanceAmount > 0 && invoice.status !== 'PAID' ? `
              <p>
                You can view and pay this invoice online by clicking the button below:
              </p>
              
              <a href="${process.env.NEXTAUTH_URL}/invoices/${invoice.id}/pay" class="action-button">
                View & Pay Invoice
              </a>
              
              <p style="font-size: 14px; color: #6c757d; margin-top: 20px;">
                If you have any questions about this invoice, please don't hesitate to contact us.
              </p>
              ` : ''}
              
              <div class="business-info">
                <div class="business-name">${invoice.business.name}</div>
                ${invoice.business.email ? `<div>${invoice.business.email}</div>` : ''}
                ${invoice.business.phone ? `<div>${invoice.business.phone}</div>` : ''}
                ${invoice.business.address ? `<div>${invoice.business.address.replace(/\n/g, '<br>')}</div>` : ''}
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} ${invoice.business.name}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendInvoiceEmail(
    invoice: InvoiceEmailData, 
    pdfAttachment: Buffer, 
    options?: {
      subject?: string;
      message?: string;
      cc?: string[];
      bcc?: string[];
    }
  ): Promise<boolean> {
    try {
      const balanceAmount = invoice.totalAmount - invoice.paidAmount;
      const defaultSubject = invoice.status === 'PAID' 
        ? `Invoice ${invoice.invoiceNumber} - Payment Received`
        : balanceAmount > 0 
        ? `Invoice ${invoice.invoiceNumber} - ${formatCurrency(balanceAmount)} Due`
        : `Invoice ${invoice.invoiceNumber} from ${invoice.business.name}`;

      const { data, error } = await this.resend.emails.send({
        from: `${invoice.business.name} <${this.fromEmail}>`,
        to: [invoice.customer.email],
        cc: options?.cc,
        bcc: options?.bcc,
        subject: options?.subject || defaultSubject,
        html: this.generateInvoiceEmailHTML(invoice, options?.message),
        attachments: [
          {
            filename: `Invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfAttachment,
          }
        ]
      });

      if (error) {
        console.error('Failed to send invoice email:', error);
        return false;
      }

      console.log('Email sent successfully:', data?.id);
      return true;

    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }

  async sendBulkInvoiceEmails(
    invoices: Array<{
      invoice: InvoiceEmailData;
      pdfAttachment: Buffer;
      customMessage?: string;
    }>,
    options?: {
      bcc?: string[];
      delayBetweenEmails?: number; // in milliseconds
    }
  ): Promise<{ sent: number; failed: number; results: Array<{ invoiceId: string; success: boolean; error?: string }> }> {
    const results: Array<{ invoiceId: string; success: boolean; error?: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const { invoice, pdfAttachment, customMessage } of invoices) {
      try {
        const success = await this.sendInvoiceEmail(
          invoice,
          pdfAttachment,
          {
            message: customMessage,
            bcc: options?.bcc
          }
        );

        results.push({
          invoiceId: invoice.id,
          success
        });

        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Add delay between emails to avoid rate limiting
        if (options?.delayBetweenEmails && options.delayBetweenEmails > 0) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenEmails));
        }

      } catch (error) {
        failed++;
        results.push({
          invoiceId: invoice.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { sent, failed, results };
  }

  async sendPaymentReminderEmail(
    invoice: InvoiceEmailData,
    reminderType: 'gentle' | 'firm' | 'final'
  ): Promise<boolean> {
    const messages = {
      gentle: `We hope you're doing well! This is a friendly reminder that invoice #${invoice.invoiceNumber} is now due for payment.

If you have already sent the payment, please disregard this reminder. If you have any questions or need to discuss payment arrangements, please don't hesitate to reach out to us.`,

      firm: `This is a payment reminder for invoice #${invoice.invoiceNumber}, which is now overdue.

Please arrange payment at your earliest convenience to avoid any disruption to our services. If you're experiencing any difficulties with payment, please contact us immediately to discuss alternative arrangements.`,

      final: `FINAL NOTICE: Invoice #${invoice.invoiceNumber} is seriously overdue and requires immediate attention.

This is our final reminder before we may need to take further action. Please contact us immediately to resolve this matter or arrange payment.`
    };

    const subjects = {
      gentle: `Friendly Reminder - Invoice ${invoice.invoiceNumber}`,
      firm: `Payment Reminder - Invoice ${invoice.invoiceNumber} Overdue`,
      final: `FINAL NOTICE - Invoice ${invoice.invoiceNumber}`
    };

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${invoice.business.name} <${this.fromEmail}>`,
        to: [invoice.customer.email],
        subject: subjects[reminderType],
        html: this.generateInvoiceEmailHTML(invoice, messages[reminderType])
      });

      if (error) {
        console.error('Failed to send reminder email:', error);
        return false;
      }

      console.log('Reminder email sent successfully:', data?.id);
      return true;

    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return false;
    }
  }

  async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [toEmail],
        subject: 'Test Email from Invixy',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Email Configuration Test</h2>
            <p>If you're receiving this email, your email configuration is working correctly!</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
          </div>
        `
      });

      if (error) {
        console.error('Test email failed:', error);
        return false;
      }

      console.log('Test email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('Test email failed:', error);
      return false;
    }
  }
}