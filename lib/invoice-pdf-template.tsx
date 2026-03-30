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
    taxRegistrationNumber?: string;
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
    itemTaxes?: Array<{
      taxRate: number;
      taxAmount: number;
      taxSystem?: {
        name: string;
      };
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

const formatDateShort = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toISOString().slice(0, 10);
};

const getTaxSummaryLines = (invoice: InvoiceData) => {
  const itemTaxMap = new Map<string, { name: string; rate: number; amount: number }>();

  invoice.items.forEach((item) => {
    item.itemTaxes?.forEach((tax) => {
      const name = tax.taxSystem?.name?.trim() || '';
      const rate = Number(tax.taxRate);
      const amount = Number(tax.taxAmount);
      if (!name || !(rate > 0) || !(amount > 0)) return;

      const key = `${name}__${rate.toFixed(6)}`;
      const existing = itemTaxMap.get(key);
      if (existing) {
        existing.amount += amount;
      } else {
        itemTaxMap.set(key, { name, rate, amount });
      }
    });
  });

  if (itemTaxMap.size > 0) {
    return Array.from(itemTaxMap.values()).map((line) => ({
      name: line.name,
      rate: line.rate,
      amount: line.amount,
      taxableBase: line.rate > 0 ? line.amount / line.rate : 0,
    }));
  }

  const invoicePositiveRateTaxes = invoice.taxes.filter((tax) => Number(tax.rate) > 0);
  const positiveRateBaseTotal = invoicePositiveRateTaxes.reduce(
    (sum, tax) => sum + (Number(tax.rate) > 0 ? Number(tax.amount) / Number(tax.rate) : 0),
    0
  );

  return invoice.taxes.map((tax) => ({
    name: tax.taxSystem.name,
    rate: Number(tax.rate),
    amount: Number(tax.amount),
    taxableBase:
      Number(tax.rate) > 0
        ? Number(tax.amount) / Number(tax.rate)
        : Math.max(Number(invoice.subtotal) - positiveRateBaseTotal, 0),
  }));
};

// --- Template 1 Styles (Classic) ---
const styles1 = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  metaText: {
    fontSize: 10,
    marginBottom: 2,
  },
  smallText: {
    fontSize: 9,
    marginBottom: 1,
  },
  contactBlock: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionCol: {
    width: '48%',
  },
  sectionLabel: {
    fontSize: 9,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  detailsBox: {
    marginBottom: 12,
  },
  detailsHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 5,
  },
  detailsLine: {
    fontSize: 10,
    marginBottom: 3,
  },
  itemsTable: {
    borderTopWidth: 1,
    borderTopColor: '#C9CDD3',
    marginTop: 6,
  },
  itemsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#C9CDD3',
    paddingVertical: 7,
    paddingHorizontal: 0,
  },
  headerCell: {
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    paddingHorizontal: 3,
  },
  itemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#C9CDD3',
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  cellText: {
    fontSize: 9,
    paddingHorizontal: 3,
    color: '#1F2937',
  },
  productText: {
    fontFamily: 'Helvetica-Bold',
  },
  colNum: { width: '4%', textAlign: 'left' },
  colProduct: { width: '24%' },
  colDescription: { width: '33%' },
  colQty: { width: '8%', textAlign: 'center' },
  colRate: { width: '11%', textAlign: 'right' },
  colAmount: { width: '11%', textAlign: 'right' },
  colTax: { width: '9%', textAlign: 'right' },
  totalsWrap: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: '40%',
    borderTopWidth: 0,
    borderTopColor: '#C9CDD3',
    borderBottomWidth: 1,
    borderBottomColor: '#C9CDD3',
    paddingTop: 8,
    paddingBottom: 8,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLineStrong: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#C9CDD3',
    marginTop: 6,
    paddingTop: 7,
    paddingBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalValue: {
    fontSize: 10,
  },
  totalValueLarge: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
  },
  strongText: {
    fontFamily: 'Helvetica-Bold',
  },
  overdueRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overdueText: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#EA580C',
  },
  footer: {
    marginTop: 12,
  },
  thanks: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
});

export const Template1: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  const getItemTaxLabel = (item: InvoiceData['items'][number]) => {
    if (!item.itemTaxes || item.itemTaxes.length === 0 || item.taxAmount <= 0) return '';

    const names = item.itemTaxes
      .map((tax) => tax.taxSystem?.name)
      .filter((name): name is string => Boolean(name && name.trim()));

    if (names.length > 0) {
      return Array.from(new Set(names)).join(', ');
    }

    const rateMatch = item.itemTaxes.find((tax) => Number(tax.taxRate) > 0);
    if (rateMatch) {
      const matchByRate = invoice.taxes.find(
        (tax) => Math.abs(Number(tax.rate) - Number(rateMatch.taxRate)) < 0.0001
      );
      if (matchByRate?.taxSystem?.name) return matchByRate.taxSystem.name;
    }

    return '';
  };

  const taxSummaryLines = getTaxSummaryLines(invoice);

  return (
    <Page size="A4" style={styles1.page}>
      <Text style={styles1.title}>INVOICE</Text>

      <View style={styles1.sectionRow}>
        <View style={styles1.sectionCol}>
          <Text style={styles1.businessName}>{invoice.business.name}</Text>
          {invoice.business.description && <Text style={styles1.smallText}>{invoice.business.description}</Text>}
          {invoice.business.address && <Text style={styles1.smallText}>{invoice.business.address}</Text>}
          {invoice.business.taxRegistrationNumber && (
            <Text style={styles1.smallText}>Tax Registration No. {invoice.business.taxRegistrationNumber}</Text>
          )}
        </View>
        <View style={styles1.contactBlock}>
          {invoice.business.email && <Text style={styles1.smallText}>{invoice.business.email}</Text>}
          {invoice.business.phone && <Text style={styles1.smallText}>{invoice.business.phone}</Text>}
        </View>
      </View>

      <View style={styles1.sectionRow}>
        <View style={styles1.sectionCol}>
          <Text style={styles1.sectionLabel}>Bill to</Text>
          <Text style={styles1.sectionTitle}>{invoice.customer.name}</Text>
          {invoice.customer.address && <Text style={styles1.metaText}>{invoice.customer.address}</Text>}
          {invoice.customer.email && <Text style={styles1.smallText}>{invoice.customer.email}</Text>}
          {invoice.customer.phone && <Text style={styles1.smallText}>{invoice.customer.phone}</Text>}
        </View>
        <View style={styles1.sectionCol}>
          <Text style={styles1.sectionLabel}>Ship to</Text>
          <Text style={styles1.sectionTitle}>{invoice.customer.name}</Text>
          {invoice.customer.address && <Text style={styles1.metaText}>{invoice.customer.address}</Text>}
          {invoice.customer.phone && <Text style={styles1.smallText}>{invoice.customer.phone}</Text>}
        </View>
      </View>

      <View style={styles1.detailsBox}>
        <Text style={styles1.detailsHeading}>Invoice details</Text>
        <Text style={styles1.detailsLine}>Invoice no.: {invoice.invoiceNumber}</Text>
        <Text style={styles1.detailsLine}>Terms: {invoice.terms || '-'}</Text>
        <Text style={styles1.detailsLine}>Invoice date: {formatDateShort(invoice.issueDate)}</Text>
        <Text style={styles1.detailsLine}>Due date: {formatDateShort(invoice.dueDate)}</Text>
      </View>

      <View style={styles1.itemsTable}>
        <View style={styles1.itemsHeader}>
          <Text style={[styles1.headerCell, styles1.colNum]}>#</Text>
          <Text style={[styles1.headerCell, styles1.colProduct]}>Product or service</Text>
          <Text style={[styles1.headerCell, styles1.colDescription]}>Description</Text>
          <Text style={[styles1.headerCell, styles1.colQty]}>Qty</Text>
          <Text style={[styles1.headerCell, styles1.colRate]}>Rate</Text>
          <Text style={[styles1.headerCell, styles1.colAmount]}>Amount</Text>
          <Text style={[styles1.headerCell, styles1.colTax]}>Tax</Text>
        </View>

        {invoice.items.map((item, index) => (
          <View key={index} style={styles1.itemRow} wrap={false}>
            <Text style={[styles1.cellText, styles1.colNum]}>{index + 1}.</Text>
            <Text style={[styles1.cellText, styles1.colProduct, styles1.productText]}>{item.product?.name || item.description}</Text>
            <Text style={[styles1.cellText, styles1.colDescription]}>{item.description}</Text>
            <Text style={[styles1.cellText, styles1.colQty]}>{item.quantity}</Text>
            <Text style={[styles1.cellText, styles1.colRate]}>{formatCurrency(item.unitPrice, invoice.currency)}</Text>
            <Text style={[styles1.cellText, styles1.colAmount]}>{formatCurrency(item.total, invoice.currency)}</Text>
            <Text style={[styles1.cellText, styles1.colTax]}>{getItemTaxLabel(item)}</Text>
          </View>
        ))}
      </View>

      <View style={styles1.totalsWrap}>
        <View style={styles1.totalsBox}>
          <View style={styles1.totalLine}>
            <Text style={styles1.totalLabel}>Subtotal</Text>
            <Text style={styles1.totalValue}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
          </View>

          {taxSummaryLines.map((tax, i) => (
            <View key={i} style={styles1.totalLine}>
              <Text style={styles1.totalLabel}>
                {`${tax.name} @ ${(tax.rate * 100).toFixed(0)}% on ${formatCurrency(tax.taxableBase, invoice.currency)}`}
              </Text>
              <Text style={styles1.totalValue}>{formatCurrency(tax.amount, invoice.currency)}</Text>
            </View>
          ))}

          <View style={styles1.totalLineStrong}>
            <Text style={[styles1.totalLabel, styles1.strongText]}>Total</Text>
            <Text style={styles1.totalValueLarge}>{formatCurrency(invoice.totalAmount, invoice.currency)}</Text>
          </View>

          <View style={styles1.overdueRow}>
            <Text style={styles1.overdueText}>Overdue</Text>
            <Text style={styles1.totalValue}>{formatDateShort(invoice.dueDate)}</Text>
          </View>
        </View>
      </View>

      <View style={styles1.footer}>
        {invoice.notes && <Text style={styles1.smallText}>{invoice.notes}</Text>}
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
  const taxSummaryLines = getTaxSummaryLines(invoice);

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
          {taxSummaryLines.map((tax, i) => (
            <View key={i} style={styles2.summaryRow}>
               <Text>Tax ({tax.name})</Text>
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
