import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'NotoSans',
  src: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
});

Font.register({
  family: 'NotoSans-Bold',
  src: 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
});

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
  const normalizedCurrency = String(currency || 'USD').trim().toUpperCase();

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      currencyDisplay: 'symbol',
    }).format(amount);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'symbol',
    }).format(amount);
  }
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

const getTotalDiscount = (invoice: InvoiceData) =>
  invoice.items.reduce((sum, item) => sum + Number(item.discount || 0), 0);

// --- Template 1 Styles (Classic) ---
const styles1 = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: 'NotoSans',
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
  colDescription: { width: '27%' },
  colQty: { width: '8%', textAlign: 'center' },
  colRate: { width: '11%', textAlign: 'right' },
  colDiscount: { width: '8%', textAlign: 'right' },
  colAmount: { width: '10%', textAlign: 'right' },
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
    fontFamily: 'NotoSans-Bold',
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
  const totalDiscount = getTotalDiscount(invoice);
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
          {invoice.business.email && <Text style={styles1.smallText}>Email: {invoice.business.email}</Text>}
          {invoice.business.phone && <Text style={styles1.smallText}>Mobile Number: {invoice.business.phone}</Text>}
        </View>
      </View>

      <View style={styles1.sectionRow}>
        <View style={styles1.sectionCol}>
          <Text style={styles1.detailsHeading}>Invoice details</Text>
          <Text style={styles1.detailsLine}>Invoice no.: {invoice.invoiceNumber}</Text>
          <Text style={styles1.detailsLine}>Currency: {String(invoice.currency || 'USD').trim().toUpperCase()}</Text>
          <Text style={styles1.detailsLine}>Invoice date: {formatDateShort(invoice.issueDate)}</Text>
          <Text style={styles1.detailsLine}>Due date: {formatDateShort(invoice.dueDate)}</Text>
        </View>

        <View style={styles1.sectionCol}>
          <Text style={styles1.sectionLabel}>Bill to</Text>
          <Text style={styles1.sectionTitle}>{invoice.customer.name}</Text>
          {invoice.customer.address && <Text style={styles1.metaText}>{invoice.customer.address}</Text>}
          {invoice.customer.email && <Text style={styles1.smallText}>{invoice.customer.email}</Text>}
          {invoice.customer.phone && <Text style={styles1.smallText}>{invoice.customer.phone}</Text>}
        </View>
      </View>

      <View style={styles1.itemsTable}>
        <View style={styles1.itemsHeader}>
          <Text style={[styles1.headerCell, styles1.colNum]}>#</Text>
          <Text style={[styles1.headerCell, styles1.colProduct]}>Product or service</Text>
          <Text style={[styles1.headerCell, styles1.colDescription]}>Description</Text>
          <Text style={[styles1.headerCell, styles1.colQty]}>Qty</Text>
          <Text style={[styles1.headerCell, styles1.colRate]}>Rate</Text>
          <Text style={[styles1.headerCell, styles1.colDiscount]}>Discount</Text>
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
            <Text style={[styles1.cellText, styles1.colDiscount]}>{item.discount ? formatCurrency(item.discount, invoice.currency) : '-'}</Text>
            <Text style={[styles1.cellText, styles1.colAmount]}>{formatCurrency(item.total, invoice.currency)}</Text>
            <Text style={[styles1.cellText, styles1.colTax]}>
              {item.taxAmount > 0 ? formatCurrency(item.taxAmount, invoice.currency) : getItemTaxLabel(item) || '-'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles1.totalsWrap}>
        <View style={styles1.totalsBox}>
          {totalDiscount > 0 && (
            <View style={styles1.totalLine}>
              <Text style={styles1.totalLabel}>Discount</Text>
              <Text style={styles1.totalValue}>-{formatCurrency(totalDiscount, invoice.currency)}</Text>
            </View>
          )}

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
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  if (isNaN(num)) return '';
  const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const format = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + format(n % 100) : '');
    if (n < 1000000) return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? format(n % 1000) : '');
    if (n < 1000000000) return format(Math.floor(n / 1000000)) + 'Million ' + (n % 1000000 !== 0 ? format(n % 1000000) : '');
    return format(Math.floor(n / 1000000000)) + 'Billion ' + (n % 1000000000 !== 0 ? format(n % 1000000000) : '');
  };
  return format(Math.floor(num)).trim();
};

const styles2 = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'NotoSans', color: '#1f2937' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  invoiceTitle: { fontSize: 24, fontFamily: 'NotoSans-Bold', color: '#111827', textTransform: 'uppercase' },
  businessBlock: { width: '50%' },
  businessName: { fontFamily: 'NotoSans-Bold', fontSize: 12, marginBottom: 4 },
  invoiceDetails: { alignItems: 'flex-end' },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { fontFamily: 'NotoSans-Bold', width: 80, textAlign: 'right', marginRight: 10 },
  metaVal: { width: 80, textAlign: 'right' },
  
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingTop: 15, borderTopWidth: 1, borderColor: '#e5e7eb' },
  addressBlock: { width: '45%' },
  addressTitle: { fontFamily: 'NotoSans-Bold', fontSize: 10, marginBottom: 4, color: '#6b7280', textTransform: 'uppercase' },
  
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 8, fontSize: 8, fontFamily: 'NotoSans-Bold', borderRadius: 4, marginBottom: 8 },
  thNum: { width: '5%' },
  thDesc: { width: '40%' },
  thQty: { width: '10%', textAlign: 'center' },
  thRate: { width: '15%', textAlign: 'right' },
  thTax: { width: '15%', textAlign: 'right' },
  thAmt: { width: '15%', textAlign: 'right' },
  
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f3f4f6', paddingVertical: 8, paddingHorizontal: 8 },
  tdNum: { width: '5%', fontSize: 8 },
  tdDesc: { width: '40%', fontSize: 8 },
  tdQty: { width: '10%', fontSize: 8, textAlign: 'center' },
  tdRate: { width: '15%', fontSize: 8, textAlign: 'right' },
  tdTax: { width: '15%', fontSize: 8, textAlign: 'right' },
  tdAmt: { width: '15%', fontSize: 8, textAlign: 'right', fontFamily: 'NotoSans-Bold' },
  
  totalsBlock: { width: '40%', alignSelf: 'flex-end', marginTop: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, paddingVertical: 2 },
  totalLabel: { fontSize: 9 },
  totalVal: { fontSize: 9, fontFamily: 'NotoSans-Bold' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderColor: '#e5e7eb' },
  grandTotalLabel: { fontSize: 11, fontFamily: 'NotoSans-Bold' },
  grandTotalVal: { fontSize: 11, fontFamily: 'NotoSans-Bold', color: '#111827' },
  
  amountWords: { marginTop: 20, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4 },
  amountWordsLabel: { fontSize: 8, color: '#6b7280', marginBottom: 2 },
  amountWordsVal: { fontSize: 9, fontFamily: 'NotoSans-Bold' },
  
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', color: '#9ca3af', fontSize: 8, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 10 }
});

export const Template2: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  const taxSummaryLines = getTaxSummaryLines(invoice);
  const totalAmount = invoice.totalAmount;
  
  return (
    <Page size="A4" style={styles2.page}>
      <View style={styles2.header}>
        <View style={styles2.businessBlock}>
          <Text style={styles2.businessName}>{invoice.business.name}</Text>
          {invoice.business.address && <Text>{invoice.business.address}</Text>}
          {invoice.business.email && <Text>{invoice.business.email}</Text>}
          {invoice.business.phone && <Text>{invoice.business.phone}</Text>}
          {invoice.business.taxRegistrationNumber && <Text>Tax ID: {invoice.business.taxRegistrationNumber}</Text>}
        </View>
        <View style={styles2.invoiceDetails}>
          <Text style={styles2.invoiceTitle}>Invoice</Text>
          <View style={{ marginTop: 10 }}>
            <View style={styles2.metaRow}>
              <Text style={styles2.metaLabel}>Invoice No.</Text>
              <Text style={styles2.metaVal}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles2.metaRow}>
              <Text style={styles2.metaLabel}>Date</Text>
              <Text style={styles2.metaVal}>{formatDateShort(invoice.issueDate)}</Text>
            </View>
            <View style={styles2.metaRow}>
              <Text style={styles2.metaLabel}>Due Date</Text>
              <Text style={styles2.metaVal}>{formatDateShort(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles2.splitRow}>
        <View style={styles2.addressBlock}>
          <Text style={styles2.addressTitle}>Bill To</Text>
          <Text style={{ fontFamily: 'NotoSans-Bold', marginBottom: 2 }}>{invoice.customer.name}</Text>
          {invoice.customer.address && <Text>{invoice.customer.address}</Text>}
          {invoice.customer.email && <Text>{invoice.customer.email}</Text>}
          {invoice.customer.phone && <Text>{invoice.customer.phone}</Text>}
        </View>
      </View>

      <View>
        <View style={styles2.tableHeader}>
          <Text style={styles2.thNum}>#</Text>
          <Text style={styles2.thDesc}>Description</Text>
          <Text style={styles2.thQty}>Qty</Text>
          <Text style={styles2.thRate}>Price</Text>
          <Text style={styles2.thTax}>Tax</Text>
          <Text style={styles2.thAmt}>Amount</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={styles2.tr}>
            <Text style={styles2.tdNum}>{i + 1}</Text>
            <View style={[styles2.tdDesc, { paddingRight: 10 }]}>
              <Text style={{ fontFamily: 'NotoSans-Bold', marginBottom: 2 }}>{item.product?.name || item.description}</Text>
              {item.product?.name && item.description && <Text style={{ color: '#6b7280' }}>{item.description}</Text>}
            </View>
            <Text style={styles2.tdQty}>{item.quantity}</Text>
            <Text style={styles2.tdRate}>{formatCurrency(item.unitPrice, invoice.currency)}</Text>
            <Text style={styles2.tdTax}>{item.taxAmount > 0 ? formatCurrency(item.taxAmount, invoice.currency) : '-'}</Text>
            <Text style={styles2.tdAmt}>{formatCurrency(item.total, invoice.currency)}</Text>
          </View>
        ))}
      </View>

      <View style={styles2.totalsBlock}>
        <View style={styles2.totalRow}>
          <Text style={styles2.totalLabel}>Subtotal</Text>
          <Text style={styles2.totalVal}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
        </View>
        
        {taxSummaryLines.map((tax, i) => (
          <View style={styles2.totalRow} key={i}>
            <Text style={styles2.totalLabel}>{tax.name} ({(tax.rate * 100).toFixed(1)}%)</Text>
            <Text style={styles2.totalVal}>{formatCurrency(tax.amount, invoice.currency)}</Text>
          </View>
        ))}
        
        <View style={styles2.grandTotal}>
          <Text style={styles2.grandTotalLabel}>Total Due</Text>
          <Text style={styles2.grandTotalVal}>{formatCurrency(invoice.totalAmount, invoice.currency)}</Text>
        </View>
      </View>

      <View style={styles2.amountWords}>
        <Text style={styles2.amountWordsLabel}>Total in Words</Text>
        <Text style={styles2.amountWordsVal}>{String(invoice.currency || 'USD').trim().toUpperCase()} {numberToWords(totalAmount)}</Text>
      </View>

      {invoice.notes && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontFamily: 'NotoSans-Bold', fontSize: 10, marginBottom: 4 }}>Notes / Terms</Text>
          <Text style={{ color: '#4b5563' }}>{invoice.notes}</Text>
          {invoice.terms && <Text style={{ color: '#4b5563', marginTop: 4 }}>{invoice.terms}</Text>}
        </View>
      )}
      
      <Text style={styles2.footer}>This is a system generated invoice and does not require a signature.</Text>
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
