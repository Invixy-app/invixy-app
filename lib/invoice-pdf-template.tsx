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
  business: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: 20,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  invoiceTitle: {
    textAlign: 'right',
  },
  invoiceText: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailsColumn: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    color: '#111827',
  },
  text: {
    fontSize: 10,
    marginBottom: 4,
    color: '#374151',
  },
  textSmall: {
    fontSize: 9,
    color: '#6B7280',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #E5E7EB',
    padding: 8,
  },
  col1: { width: '35%' },
  col2: { width: '10%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '10%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    borderBottom: '1px solid #E5E7EB',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    marginTop: 5,
    backgroundColor: '#F9FAFB',
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const InvoicePDFTemplate: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD'
    }).format(amount);
  };

  return (
    <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{invoice.business.name}</Text>
          {invoice.business.email && <Text style={styles.textSmall}>{invoice.business.email}</Text>}
          {invoice.business.phone && <Text style={styles.textSmall}>{invoice.business.phone}</Text>}
          {invoice.business.address && <Text style={styles.textSmall}>{invoice.business.address}</Text>}
        </View>
        <View style={styles.invoiceTitle}>
          <Text style={styles.invoiceText}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          <Text style={styles.textSmall}>{invoice.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Bill To and Invoice Details */}
      <View style={styles.detailsRow}>
        <View style={styles.detailsColumn}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.text}>{invoice.customer.name}</Text>
          {invoice.customer.email && <Text style={styles.textSmall}>{invoice.customer.email}</Text>}
          {invoice.customer.phone && <Text style={styles.textSmall}>{invoice.customer.phone}</Text>}
          {invoice.customer.address && <Text style={styles.textSmall}>{invoice.customer.address}</Text>}
        </View>
        <View style={styles.detailsColumn}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <Text style={styles.textSmall}>Issue Date: {formatDate(invoice.issueDate)}</Text>
          <Text style={styles.textSmall}>Due Date: {formatDate(invoice.dueDate)}</Text>
          <Text style={styles.textSmall}>Currency: {invoice.currency}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Unit Price</Text>
          <Text style={styles.col4}>Discount</Text>
          <Text style={styles.col5}>Tax</Text>
          <Text style={styles.col6}>Total</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.col1}>
              <Text>{item.description}</Text>
              {item.product && <Text style={styles.textSmall}>{item.product.name}</Text>}
            </View>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.col4}>{item.discount && item.discount > 0 ? formatCurrency(item.discount) : '-'}</Text>
            <Text style={styles.col5}>{item.taxAmount > 0 ? formatCurrency(item.taxAmount) : '-'}</Text>
            <Text style={styles.col6}>{formatCurrency(item.total + item.taxAmount)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        {invoice.taxes.map((tax, index) => (
          <View key={index} style={styles.totalRow}>
            <Text style={styles.textSmall}>{tax.taxSystem.name} ({(tax.rate * 100).toFixed(1)}%):</Text>
            <Text style={styles.textSmall}>{formatCurrency(tax.amount)}</Text>
          </View>
        ))}
        <View style={styles.grandTotal}>
          <Text>Total:</Text>
          <Text>{formatCurrency(invoice.totalAmount)}</Text>
        </View>
        {invoice.paidAmount > 0 && (
          <>
            <View style={styles.totalRow}>
              <Text>Paid:</Text>
              <Text>{formatCurrency(invoice.paidAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Balance:</Text>
              <Text>{formatCurrency(invoice.totalAmount - invoice.paidAmount)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.textSmall}>{invoice.notes}</Text>
        </View>
      )}

      {/* Terms */}
      {invoice.terms && (
        <View style={{ marginTop: 15 }}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.textSmall}>{invoice.terms}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Invoice #{invoice.invoiceNumber} | {invoice.business.name} | Generated on {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
    </Document>
  );
};

export default InvoicePDFTemplate;
