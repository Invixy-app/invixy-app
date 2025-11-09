import puppeteer from 'puppeteer';
import { formatCurrency } from '@/lib/utils';

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
  private static getInvoiceHTML(invoice: InvoiceData): string {
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const balanceAmount = invoice.totalAmount - invoice.paidAmount;
    const isOverdue = new Date(invoice.dueDate) < new Date() && balanceAmount > 0;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: #fff;
              padding: 40px;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            
            .logo-section {
              flex: 1;
            }
            
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
            }
            
            .company-details {
              color: #6b7280;
              font-size: 14px;
              line-height: 1.5;
            }
            
            .invoice-title {
              text-align: right;
              flex: 1;
            }
            
            .invoice-title h1 {
              font-size: 36px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
            }
            
            .invoice-number {
              font-size: 18px;
              color: #6b7280;
              margin-bottom: 4px;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            
            .status-draft { background: #f3f4f6; color: #374151; }
            .status-sent { background: #dbeafe; color: #1d4ed8; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-partial-paid { background: #fef3c7; color: #92400e; }
            .status-overdue { background: #fee2e2; color: #dc2626; }
            .status-cancelled { background: #f3f4f6; color: #6b7280; }
            
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            
            .detail-section {
              flex: 1;
              margin-right: 40px;
            }
            
            .detail-section:last-child {
              margin-right: 0;
            }
            
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .detail-item {
              margin-bottom: 8px;
              font-size: 14px;
            }
            
            .detail-label {
              color: #6b7280;
              margin-bottom: 2px;
            }
            
            .detail-value {
              color: #1f2937;
              font-weight: 500;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .items-table th {
              background: #f9fafb;
              padding: 12px 16px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .items-table th:last-child,
            .items-table td:last-child {
              text-align: right;
            }
            
            .items-table td {
              padding: 12px 16px;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .items-table tr:last-child td {
              border-bottom: none;
            }
            
            .item-description {
              font-weight: 500;
              color: #1f2937;
              margin-bottom: 2px;
            }
            
            .item-product {
              font-size: 12px;
              color: #6b7280;
            }
            
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            
            .totals-table {
              width: 300px;
            }
            
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .totals-row:last-child {
              border-bottom: 2px solid #e5e7eb;
              font-weight: bold;
              font-size: 18px;
              color: #1f2937;
              padding-top: 12px;
            }
            
            .tax-row {
              font-size: 14px;
              color: #6b7280;
            }
            
            .payment-section {
              margin-top: 30px;
            }
            
            .payment-progress {
              background: #f3f4f6;
              height: 8px;
              border-radius: 4px;
              overflow: hidden;
              margin: 12px 0;
            }
            
            .payment-progress-bar {
              height: 100%;
              background: #10b981;
              transition: width 0.3s ease;
            }
            
            .payment-stats {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            
            .payment-stat {
              text-align: center;
              flex: 1;
            }
            
            .payment-amount {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .payment-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
            }
            
            .paid-amount { color: #10b981; }
            .remaining-amount { color: #f59e0b; }
            .total-amount { color: #1f2937; }
            
            .payments-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .notes-section {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            
            .notes-content {
              background: #f9fafb;
              padding: 16px;
              border-radius: 8px;
              font-size: 14px;
              line-height: 1.6;
              color: #4b5563;
              white-space: pre-wrap;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
            }
            
            .overdue-notice {
              background: #fee2e2;
              border: 1px solid #fca5a5;
              color: #dc2626;
              padding: 12px 16px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-weight: 600;
            }
            
            @media print {
              body { padding: 20px; }
              .container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo-section">
                <div class="company-name">${invoice.business.name}</div>
                <div class="company-details">
                  ${invoice.business.email ? `${invoice.business.email}<br>` : ''}
                  ${invoice.business.phone ? `${invoice.business.phone}<br>` : ''}
                  ${invoice.business.address ? invoice.business.address.replace(/\n/g, '<br>') : ''}
                </div>
              </div>
              <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-number">#${invoice.invoiceNumber}</div>
                <span class="status-badge status-${invoice.status.toLowerCase().replace('_', '-')}">
                  ${invoice.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            ${isOverdue ? `
            <div class="overdue-notice">
              ⚠️ This invoice is overdue. Payment was due on ${formatDate(invoice.dueDate)}.
            </div>
            ` : ''}

            <!-- Invoice Details -->
            <div class="invoice-details">
              <div class="detail-section">
                <div class="section-title">Bill To</div>
                <div class="detail-item">
                  <div class="detail-value">${invoice.customer.name}</div>
                </div>
                ${invoice.customer.email ? `
                <div class="detail-item">
                  <div class="detail-value">${invoice.customer.email}</div>
                </div>
                ` : ''}
                ${invoice.customer.phone ? `
                <div class="detail-item">
                  <div class="detail-value">${invoice.customer.phone}</div>
                </div>
                ` : ''}
                ${invoice.customer.address ? `
                <div class="detail-item">
                  <div class="detail-value">${invoice.customer.address.replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}
              </div>
              
              <div class="detail-section">
                <div class="section-title">Invoice Details</div>
                <div class="detail-item">
                  <div class="detail-label">Issue Date</div>
                  <div class="detail-value">${formatDate(invoice.issueDate)}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Due Date</div>
                  <div class="detail-value">${formatDate(invoice.dueDate)}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Currency</div>
                  <div class="detail-value">${invoice.currency}</div>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Discount</th>
                  <th style="text-align: right;">Tax</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>
                      <div class="item-description">${item.description}</div>
                      ${item.product ? `<div class="item-product">${item.product.name}${item.product.sku ? ` (${item.product.sku})` : ''}</div>` : ''}
                      ${item.itemTaxes && item.itemTaxes.length > 0 ? `
                        <div class="item-product">Taxes: ${item.itemTaxes.map(tax => `${(tax.taxRate * 100).toFixed(2)}%`).join(', ')}</div>
                      ` : ''}
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
                    <td style="text-align: right;">${item.discount && item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                    <td style="text-align: right;">${item.taxAmount > 0 ? formatCurrency(item.taxAmount) : '-'}</td>
                    <td style="text-align: right;">${formatCurrency(item.total + item.taxAmount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
              <div class="totals-table">
                <div class="totals-row">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(invoice.subtotal)}</span>
                </div>
                
                ${invoice.taxes.map(tax => `
                  <div class="totals-row tax-row">
                    <span>${tax.taxSystem.name} (${(tax.rate * 100).toFixed(1)}%):</span>
                    <span>${formatCurrency(tax.amount)}</span>
                  </div>
                `).join('')}
                
                <div class="totals-row">
                  <span>Total:</span>
                  <span>${formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            <!-- Payment Information -->
            ${invoice.paidAmount > 0 || invoice.payments.length > 0 ? `
            <div class="payment-section">
              <div class="section-title">Payment Information</div>
              
              <div class="payment-stats">
                <div class="payment-stat">
                  <div class="payment-amount paid-amount">${formatCurrency(invoice.paidAmount)}</div>
                  <div class="payment-label">Paid</div>
                </div>
                <div class="payment-stat">
                  <div class="payment-amount remaining-amount">${formatCurrency(balanceAmount)}</div>
                  <div class="payment-label">Balance</div>
                </div>
                <div class="payment-stat">
                  <div class="payment-amount total-amount">${formatCurrency(invoice.totalAmount)}</div>
                  <div class="payment-label">Total</div>
                </div>
              </div>
              
              <div class="payment-progress">
                <div class="payment-progress-bar" style="width: ${(invoice.paidAmount / invoice.totalAmount * 100).toFixed(1)}%"></div>
              </div>

              ${invoice.payments.length > 0 ? `
              <table class="payments-table">
                <thead>
                  <tr>
                    <th>Payment Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.payments.map(payment => `
                    <tr>
                      <td>${formatDate(payment.paymentDate)}</td>
                      <td>${payment.paymentMethod.replace('_', ' ')}</td>
                      <td>${payment.reference || '-'}</td>
                      <td style="text-align: right;">${formatCurrency(payment.amount)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ` : ''}
            </div>
            ` : ''}

            <!-- Notes and Terms -->
            ${invoice.notes || invoice.terms ? `
            <div class="notes-section">
              ${invoice.notes ? `
              <div class="section-title">Notes</div>
              <div class="notes-content">${invoice.notes}</div>
              ` : ''}
              
              ${invoice.terms ? `
              <div class="section-title" style="margin-top: 20px;">Terms & Conditions</div>
              <div class="notes-content">${invoice.terms}</div>
              ` : ''}
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>Invoice #${invoice.invoiceNumber} | ${invoice.business.name}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static async generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Set the HTML content
      const html = this.getInvoiceHTML(invoice);
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      return Buffer.from(pdf);

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  static async generateMultipleInvoicesPDF(invoices: InvoiceData[]): Promise<Buffer> {
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Combine all invoice HTML with page breaks
      const combinedHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Invoices Batch</title>
            <style>
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>
            ${invoices.map((invoice, index) => `
              <div class="${index < invoices.length - 1 ? 'page-break' : ''}">
                ${this.getInvoiceHTML(invoice)}
              </div>
            `).join('')}
          </body>
        </html>
      `;

      await page.setContent(combinedHTML, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });

      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      return Buffer.from(pdf);

    } catch (error) {
      console.error('Error generating batch PDF:', error);
      throw new Error('Failed to generate batch PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}