import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
  // salespersonName?: string;
  business: {
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    invoiceTemplate?: string;
  };
  customer: {
    id?: string;
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
    };
  }>;
  payments: Array<{
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
  }>;
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
};

// --- Template 1 Styles (Classic) ---
const styles1 = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  slogan: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#6B7280',
    marginBottom: 10,
  },
  invoiceMeta: {
    textAlign: 'right',
  },
  invoiceMetaText: {
    fontSize: 10,
    marginBottom: 2,
  },
  addressesRow: {
    flexDirection: 'row',
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  addressCol: {
    width: '45%',
  },
  addressLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 4,
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentsLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 2,
  },
  topTable: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 20,
  },
  topTableCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    flex: 1,
    textAlign: 'center',
  },
  topTableHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 2,
  },
  topTableContent: {
    fontSize: 8,
  },
  mainTable: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 10,
  },
  mainTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Helvetica-Bold',
    padding: 6,
    textAlign: 'center',
  },
  mainTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 6,
    height: 24, // Fixed height for rows
  },
  colQty: { width: '15%', textAlign: 'center' },
  colDesc: { width: '45%', textAlign: 'left', paddingLeft: 5 },
  colPrice: { width: '20%', textAlign: 'right', paddingRight: 5 },
  colTotal: { width: '20%', textAlign: 'right', paddingRight: 5 },
  totalsSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    width: '40%',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  totalLabel: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    flex: 1, // Changed from width to flex for better alignment in container
    textAlign: 'right',
    fontFamily: 'Helvetica', // Default font
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    marginBottom: 20,
  },
  thankYou: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
  },
});

export const Template1: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  // Generate empty rows to fill the table look if items are few
  const emptyRows = Math.max(0, 10 - invoice.items.length);

  return (
    <Page size="A4" style={styles1.page}>
      {/* Header */}
      <View style={styles1.header}>
        <View style={styles1.headerLeft}>
          <Text style={styles1.companyName}>{invoice.business.name}</Text>
          {invoice.business.description && (
             <Text style={styles1.slogan}>{invoice.business.description}</Text>
          )}
          <Text>{invoice.business.address}</Text>
          {invoice.business.phone && <Text>Phone: {invoice.business.phone}</Text>}
          {invoice.business.email && <Text>Email: {invoice.business.email}</Text>}
        </View>
        <View style={styles1.headerRight}>
          <Text style={styles1.invoiceTitle}>INVOICE</Text>
          <Text style={styles1.invoiceMetaText}>INVOICE #{invoice.invoiceNumber}</Text>
          <Text style={styles1.invoiceMetaText}>DATE: {formatDate(invoice.issueDate)}</Text>
        </View>
      </View>

      {/* Addresses */}
      <View style={styles1.addressesRow}>
        <View style={styles1.addressCol}>
          <Text style={styles1.addressLabel}>TO:</Text>
          <Text>{invoice.customer.name}</Text>
          <Text>{invoice.customer.address}</Text>
           {invoice.customer.phone && <Text>Phone: {invoice.customer.phone}</Text>}
        </View>
        <View style={styles1.addressCol}>
          <Text style={styles1.addressLabel}>SHIP TO:</Text>
          <Text>{invoice.customer.name}</Text>
          <Text>{invoice.customer.address}</Text>
           {invoice.customer.phone && <Text>Phone: {invoice.customer.phone}</Text>}
        </View>
      </View>

      {/* Comments */}
      {invoice.notes && (
        <View style={styles1.commentsSection}>
          <Text style={styles1.commentsLabel}>COMMENTS OR SPECIAL INSTRUCTIONS:</Text>
          <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#6B7280' }}>
            {invoice.notes}
          </Text>
        </View>
      )}

      {/* Top Details Table - Only Terms since other fields aren't in DB */}
      <View style={styles1.topTable}>
          <View style={{ ...styles1.topTableCell, borderRightWidth: 0 }}>
            <Text style={styles1.topTableHeader}>TERMS</Text>
            <Text style={styles1.topTableContent}>{invoice.terms || '-'}</Text>
          </View>
      </View>

      {/* Main Table */}
      <View style={styles1.mainTable}>
        <View style={styles1.mainTableHeader}>
          <Text style={styles1.colQty}>QUANTITY</Text>
          <Text style={styles1.colDesc}>DESCRIPTION</Text>
          <Text style={styles1.colPrice}>UNIT PRICE</Text>
          <Text style={styles1.colTotal}>TOTAL</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={index} style={styles1.mainTableRow}>
            <Text style={styles1.colQty}>{item.quantity}</Text>
            <Text style={styles1.colDesc}>{item.description}</Text>
            <Text style={styles1.colPrice}>{formatCurrency(item.unitPrice, invoice.currency)}</Text>
            <Text style={styles1.colTotal}>{formatCurrency(item.total, invoice.currency)}</Text>
          </View>
        ))}
        {/* Empty rows for visual consistency */}
        {Array.from({ length: emptyRows }).map((_, index) => (
           <View key={`empty-${index}`} style={styles1.mainTableRow}>
             <Text style={styles1.colQty}></Text>
             <Text style={styles1.colDesc}></Text>
             <Text style={styles1.colPrice}></Text>
             <Text style={styles1.colTotal}></Text>
           </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles1.totalsSection}>
        <View style={styles1.totalRow}>
          <Text style={styles1.totalLabel}>SUBTOTAL</Text>
          <Text style={styles1.totalValue}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
        </View>
        {invoice.taxes.map((tax, i) => (
             <View key={i} style={styles1.totalRow}>
               <Text style={styles1.totalLabel}>TAX ({tax.taxSystem.name} {(tax.rate * 100).toFixed(1)}%)</Text>
               <Text style={styles1.totalValue}>{formatCurrency(tax.amount, invoice.currency)}</Text>
             </View>
        ))}
        <View style={styles1.totalRow}>
          <Text style={styles1.totalLabel}>SHIPPING & HANDLING</Text>
          <Text style={styles1.totalValue}>-</Text>
        </View>
        <View style={{ ...styles1.totalRow, borderBottomWidth: 0 }}>
          <Text style={styles1.totalLabel}>TOTAL DUE</Text>
          <Text style={styles1.totalValue}>{formatCurrency(invoice.totalAmount, invoice.currency)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles1.footer}>
        <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 9 }}>Make all checks payable to {invoice.business.name}</Text>
            {invoice.business.phone && <Text style={{ fontSize: 9 }}>If you have any questions concerning this invoice, contact {invoice.business.name}, {invoice.business.phone}, {invoice.business.email}</Text>}
        </View>
        <Text style={styles1.thankYou}>THANK YOU FOR YOUR BUSINESS!</Text>
      </View>
    </Page>
  );
};

// --- Template 2 Styles (Professional/Modern) ---
const styles2 = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    marginBottom: 30,
  },
  logoText: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#2F5C96', // Blue color from image
    textTransform: 'uppercase',
  },
  headerDate: {
    fontSize: 10,
    color: '#2F5C96',
    marginTop: 4,
    fontFamily: 'Helvetica-Bold',
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#2F5C96',
    marginTop: 20,
    marginBottom: 10,
  },
  addressBoxContainer: {
    flexDirection: 'row',
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#93C5FD', // Light blue border
  },
  addressBox: {
    width: '50%',
  },
  addressBoxHeader: {
    backgroundColor: '#DCE6F1', // Light blue background
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#93C5FD',
  },
  addressBoxContent: {
    padding: 8,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  addressLabel: {
    width: 80,
    fontFamily: 'Helvetica-Bold',
  },
  addressValue: {
    flex: 1,
  },
  detailsGrid: {
    marginTop: -1, // Overlap border
    borderWidth: 1,
    borderColor: '#93C5FD',
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#93C5FD',
  },
  detailsCell: {
    flex: 1,
    padding: 2,
  },
  detailsLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 2,
    color: '#000',
    paddingLeft: 4,
  },
  detailsValue: {
    paddingLeft: 4,
    fontSize: 9,
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#DCE6F1',
    borderBottomWidth: 1,
    borderBottomColor: '#93C5FD',
    padding: 6,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#93C5FD',
    padding: 6,
    height: 20,
  },
  colQty: { width: '8%', textAlign: 'center' },
  colItem: { width: '12%', textAlign: 'center' },
  colDesc: { width: '40%' },
  colPrice: { width: '15%', textAlign: 'right' },
  colDiscount: { width: '10%', textAlign: 'center' },
  colTotal: { width: '15%', textAlign: 'right' },

  summarySection: {
    marginTop: 0, 
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryTable: {
    width: '40%',
    borderLeftWidth: 1,
    borderLeftColor: '#93C5FD',
    borderRightWidth: 1,
    borderRightColor: '#93C5FD',
    borderBottomWidth: 1,
    borderBottomColor: '#93C5FD',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#93C5FD',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    backgroundColor: '#93C5FD', // Darker blue for total
  },
  footer: {
    marginTop: 40,
  },
  thankYou: {
    color: '#2F5C96',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
  },
  companyFooter: {
    fontSize: 9,
    color: '#4B5563',
  },
});

export const Template2: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  // Generate empty rows
  const emptyRows = Math.max(0, 8 - invoice.items.length);

  return (
    <Page size="A4" style={styles2.page}>
      {/* Header */}
      <View style={styles2.header}>
        <Text style={styles2.logoText}>{invoice.business.name}</Text>
        <Text style={styles2.headerDate}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        <Text style={styles2.invoiceTitle}>INVOICE #{invoice.invoiceNumber}</Text>
      </View>

      {/* Bill To / Ship To Grid */}
      <View style={styles2.addressBoxContainer}>
        <View style={{ ...styles2.addressBox, borderRightWidth: 1, borderRightColor: '#93C5FD' }}>
          <View style={styles2.addressBoxHeader}><Text>Bill to</Text></View>
          <View style={styles2.addressBoxContent}>
             <View style={styles2.addressRow}><Text style={styles2.addressLabel}>Customer</Text><Text style={styles2.addressValue}>{invoice.customer.name}</Text></View>
             <View style={styles2.addressRow}><Text style={styles2.addressLabel}>Customer ID#</Text><Text style={styles2.addressValue}>{invoice.customer.id ? invoice.customer.id.substring(0, 8) : '-'}</Text></View>
             <View style={styles2.addressRow}><Text style={styles2.addressLabel}>Address</Text><Text style={styles2.addressValue}>{invoice.customer.address || '-'}</Text></View>
             <View style={styles2.addressRow}><Text style={styles2.addressLabel}>Phone</Text><Text style={styles2.addressValue}>{invoice.customer.phone || '-'}</Text></View>
          </View>
        </View>
        <View style={styles2.addressBox}>
          <View style={styles2.addressBoxHeader}><Text>Ship to</Text></View>
          <View style={styles2.addressBoxContent}>
             <View style={styles2.addressRow}><Text style={styles2.addressLabel}>Recipient</Text><Text style={styles2.addressValue}>{invoice.customer.name}</Text></View>
             <View style={styles2.addressRow}><Text style={styles2.addressLabel}>Address</Text><Text style={styles2.addressValue}>{invoice.customer.address || '-'}</Text></View>
             <View style={styles2.addressRow}><Text style={styles2.addressLabel}>Phone</Text><Text style={styles2.addressValue}>{invoice.customer.phone || '-'}</Text></View>
          </View>
        </View>
      </View>

      {/* Middle Details Grid - Simplified to remove placeholders */}
      <View style={styles2.detailsGrid}>
        <View style={{ ...styles2.detailsRow, borderBottomWidth: 0 }}>
          <View style={styles2.detailsCell}><Text style={styles2.detailsLabel}>Payment Due</Text><Text style={styles2.detailsValue}>{formatDate(invoice.dueDate)}</Text></View>
          <View style={{ ...styles2.detailsCell, borderLeftWidth: 1, borderLeftColor: '#93C5FD' }}><Text style={styles2.detailsLabel}>Payment Terms</Text><Text style={styles2.detailsValue}>{invoice.terms || '-'}</Text></View>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles2.table}>
        <View style={styles2.tableHeader}>
          <Text style={styles2.colQty}>Qty.</Text>
          <Text style={styles2.colItem}>Item#</Text>
          <Text style={styles2.colDesc}>Description</Text>
          <Text style={styles2.colPrice}>Unit price</Text>
          <Text style={styles2.colDiscount}>Discount</Text>
          <Text style={styles2.colTotal}>Line total</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={index} style={styles2.tableRow}>
             <Text style={styles2.colQty}>{item.quantity}</Text>
             <Text style={styles2.colItem}>{item.product?.sku || '-'}</Text>
             <Text style={styles2.colDesc}>{item.description}</Text>
             <Text style={styles2.colPrice}>{formatCurrency(item.unitPrice, invoice.currency)}</Text>
             <Text style={styles2.colDiscount}>{item.discount ? formatCurrency(item.discount, invoice.currency) : ''}</Text>
             <Text style={styles2.colTotal}>{formatCurrency(item.total, invoice.currency)}</Text>
          </View>
        ))}
         {Array.from({ length: emptyRows }).map((_, index) => (
           <View key={`empty-${index}`} style={styles2.tableRow}>
             <Text style={styles2.colQty}></Text>
             <Text style={styles2.colItem}></Text>
             <Text style={styles2.colDesc}></Text>
             <Text style={styles2.colPrice}></Text>
             <Text style={styles2.colDiscount}></Text>
             <Text style={styles2.colTotal}></Text>
           </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles2.summarySection}>
        <View style={styles2.summaryTable}>
          <View style={styles2.summaryRow}>
             <Text>Total Discount</Text>
             <Text>0</Text>
          </View>
          <View style={styles2.summaryRow}>
             <Text>Subtotal</Text>
             <Text>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
          </View>
          {invoice.taxes.map((tax, i) => (
            <View key={i} style={styles2.summaryRow}>
               <Text>Tax ({tax.taxSystem.name})</Text>
               <Text>{formatCurrency(tax.amount, invoice.currency)}</Text>
            </View>
          ))}
          <View style={styles2.totalRow}>
             <Text style={{ fontFamily: 'Helvetica-Bold' }}>Total</Text>
             <Text style={{ fontFamily: 'Helvetica-Bold' }}>{formatCurrency(invoice.totalAmount, invoice.currency)}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles2.footer}>
        <Text style={styles2.thankYou}>Thank you for your business!</Text>
        <View style={{ marginTop: 20 }}>
           <Text style={{ ...styles2.companyFooter, fontFamily: 'Helvetica-Bold' }}>{invoice.business.name}</Text>
           <Text style={styles2.companyFooter}>{invoice.business.address}</Text>
           <Text style={styles2.companyFooter}>{invoice.business.phone} | {invoice.business.email}</Text>
        </View>
      </View>

    </Page>
  );
};

const InvoicePDFTemplate: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  const template = invoice.business.invoiceTemplate || 'TEMPLATE_1';

  return (
    <Document>
      {template === 'TEMPLATE_2' ? (
        <Template2 invoice={invoice} />
      ) : (
        <Template1 invoice={invoice} />
      )}
    </Document>
  );
};

export default InvoicePDFTemplate;
