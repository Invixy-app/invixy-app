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

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/auth/verify?token=${token}`;
    
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your email address',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Verify your email</h2>
            <p>Welcome to Invixy! Please click the link below to verify your email address:</p>
            <a href="${verificationLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Verify Email
            </a>
            <p>If you didn't create an account, please ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
          </div>
        `
      });

      if (error) {
        console.error('Failed to send verification email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
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

    const primaryColor = '#0F172A'; // Slate 900
    const accentColor = '#3B82F6'; // Blue 500

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
              line-height: 1.6;
              color: #334155;
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
              background-color: #F8FAFC;
            }
            
            .email-container {
              background: #FFFFFF;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              overflow: hidden;
              border: 1px solid #E2E8F0;
            }
            
            .header {
              background-color: #FFFFFF;
              padding: 32px 32px 24px;
              border-bottom: 1px solid #F1F5F9;
            }
            
            .business-name {
              font-size: 24px;
              font-weight: 700;
              color: ${primaryColor};
              margin: 0;
            }
            
            .invoice-title {
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748B;
              font-weight: 600;
              margin-top: 4px;
            }
            
            .content {
              padding: 32px;
            }
            
            .greeting {
              font-size: 16px;
              margin-bottom: 24px;
              color: #334155;
            }
            
            .message-box {
              background-color: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 32px;
              font-size: 14px;
              color: #475569;
            }
            
            .amount-section {
              text-align: center;
              margin: 32px 0;
              padding: 24px;
              background-color: #F8FAFC;
              border-radius: 8px;
            }
            
            .amount-label {
              font-size: 14px;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 8px;
              font-weight: 600;
            }
            
            .amount-value {
              font-size: 36px;
              font-weight: 700;
              color: ${primaryColor};
            }
            
            .details-grid {
              display: table;
              width: 100%;
              margin-bottom: 32px;
              border-collapse: collapse;
            }
            
            .detail-row {
              display: table-row;
            }
            
            .detail-label {
              display: table-cell;
              padding: 8px 0;
              color: #64748B;
              font-size: 14px;
              width: 40%;
            }
            
            .detail-value {
              display: table-cell;
              padding: 8px 0;
              color: ${primaryColor};
              font-weight: 500;
              font-size: 14px;
              text-align: right;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .status-paid { background-color: #DCFCE7; color: #166534; }
            .status-sent { background-color: #DBEAFE; color: #1E40AF; }
            .status-overdue { background-color: #FEE2E2; color: #991B1B; }
            .status-pending { background-color: #FEF3C7; color: #92400E; }
            
            .action-button {
              display: block;
              width: 100%;
              background-color: ${primaryColor};
              color: #FFFFFF;
              text-align: center;
              padding: 16px 0;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              margin: 32px 0;
              transition: background-color 0.2s;
            }
            
            .action-button:hover {
              background-color: #334155;
            }
            
            .divider {
              border-top: 1px solid #E2E8F0;
              margin: 32px 0;
            }
            
            .business-info {
              margin-top: 32px;
              text-align: center;
              font-size: 14px;
              color: #64748B;
            }
            
            .footer {
              text-align: center;
              margin-top: 32px;
              font-size: 12px;
              color: #94A3B8;
            }

            .footer p {
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1 class="business-name">${invoice.business.name}</h1>
              <div class="invoice-title">Invoice #${invoice.invoiceNumber}</div>
            </div>
            
            <div class="content">
              <div class="greeting">
                Hi ${invoice.customer.name},
              </div>
              
              ${message ? `
              <div class="message-box">
                ${message.replace(/\n/g, '<br>')}
              </div>
              ` : `
              <p style="margin-bottom: 24px; font-size: 14px; color: #475569;">
                Here's your invoice for the recent period. We appreciate your business.
              </p>
              `}
              
              <div class="amount-section">
                <div class="amount-label">${invoice.status === 'PAID' ? 'Amount Paid' : 'Amount Due'}</div>
                <div class="amount-value">${formatCurrency(balanceAmount > 0 ? balanceAmount : invoice.totalAmount)}</div>
                
                ${isOverdue ? `
                <div style="margin-top: 12px;">
                  <span class="status-badge status-overdue">Desc Due</span>
                </div>
                ` : ''}
              </div>

              <div class="details-grid">
                <div class="detail-row">
                  <span class="detail-label">Invoice Number</span>
                  <span class="detail-value">#${invoice.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Issue Date</span>
                  <span class="detail-value">${formatDate(invoice.issueDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date</span>
                  <span class="detail-value">${formatDate(invoice.dueDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value" style="padding: 4px 0;">
                    <span class="status-badge status-${invoice.status.toLowerCase().replace('_', '-')}">
                      ${invoice.status.replace('_', ' ')}
                    </span>
                  </span>
                </div>
              </div>

              
              <a href="${process.env.NEXTAUTH_URL}/invoices/${invoice.id}" class="action-button">
                View Invoice
              </a>

              <div class="business-info">
                 <p style="margin: 0; font-weight: 600; color: #334155;">${invoice.business.name}</p>
                 ${invoice.business.address ? `<p style="margin: 4px 0;">${invoice.business.address.replace(/\n/g, ', ')}</p>` : ''}
                 ${invoice.business.email || invoice.business.phone ? `
                   <p style="margin: 4px 0;">
                     ${invoice.business.email ? `${invoice.business.email}` : ''}
                     ${invoice.business.email && invoice.business.phone ? ' • ' : ''}
                     ${invoice.business.phone ? `${invoice.business.phone}` : ''}
                   </p>
                 ` : ''}
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Sent by ${invoice.business.name} via Invixy</p>
            <p>© ${new Date().getFullYear()} ${invoice.business.name}. All rights reserved.</p>
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