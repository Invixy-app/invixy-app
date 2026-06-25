import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuG1fAZJhjp-Ek-_EeA.woff', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', backgroundColor: '#ffffff', color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottom: '1px solid #e5e7eb', paddingBottom: 20 },
  businessInfo: { gap: 4 },
  businessName: { fontSize: 24, fontWeight: 700, color: '#111827' },
  reportInfo: { alignItems: 'flex-end', gap: 4 },
  title: { fontSize: 18, fontWeight: 700, color: '#111827' },
  dateText: { fontSize: 10, color: '#6b7280' },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 24, color: '#111827' },
  summaryGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  summaryBox: { flex: 1, padding: 12, backgroundColor: '#f9fafb', borderRadius: 4, border: '1px solid #e5e7eb' },
  summaryLabel: { fontSize: 10, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: 700, color: '#111827' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, borderColor: '#e5e7eb' },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb' },
  tableCellHeader: { margin: 5, fontSize: 10, fontWeight: 700, color: '#374151' },
  tableCell: { margin: 5, fontSize: 10, color: '#4b5563' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 10 },
  footerText: { fontSize: 10, color: '#9ca3af' }
});

export interface FinancialStatementData {
  businessName: string;
  timeframeLabel: string;
  currency: string;
  summary: {
    totalRevenue: number;
    totalOutstanding: number;
    totalTaxCollected: number;
    totalInvoices: number;
  };
  taxJurisdictions: Array<{
    jurisdiction: string;
    taxType: string;
    taxCollected: number;
  }>;
  transactions: Array<{
    date: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
  }>;
}

function formatNumber(num: number) {
  return Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

export default function FinancialStatementPDFTemplate({ data }: { data: FinancialStatementData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{data.businessName}</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.title}>Financial Statement</Text>
            <Text style={styles.dateText}>Period: {data.timeframeLabel}</Text>
            <Text style={styles.dateText}>Currency: {data.currency}</Text>
            <Text style={styles.dateText}>Generated: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>{formatNumber(data.summary.totalRevenue)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Outstanding</Text>
            <Text style={styles.summaryValue}>{formatNumber(data.summary.totalOutstanding)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Tax Collected</Text>
            <Text style={styles.summaryValue}>{formatNumber(data.summary.totalTaxCollected)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tax Liabilities</Text>
        <View style={[styles.table, { marginBottom: 24 }]}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '40%' }]}><Text style={styles.tableCellHeader}>Jurisdiction</Text></View>
            <View style={[styles.tableColHeader, { width: '30%' }]}><Text style={styles.tableCellHeader}>Tax Type</Text></View>
            <View style={[styles.tableColHeader, { width: '30%' }]}><Text style={styles.tableCellHeader}>Tax Collected</Text></View>
          </View>
          {data.taxJurisdictions.map((tax, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>{tax.jurisdiction}</Text></View>
              <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableCell}>{tax.taxType}</Text></View>
              <View style={[styles.tableCol, { width: '30%' }]}><Text style={styles.tableCell}>{formatNumber(tax.taxCollected)}</Text></View>
            </View>
          ))}
          {data.taxJurisdictions.length === 0 && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '100%' }]}><Text style={styles.tableCell}>No taxes collected in this period.</Text></View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Sales & Receivables</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Date</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Invoice No.</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Customer</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Amount ({data.currency})</Text></View>
          </View>
          {data.transactions.slice(0, 50).map((trx, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{new Date(trx.date).toLocaleDateString()}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{trx.invoiceNumber}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{trx.customerName}</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{formatNumber(trx.totalAmount)}</Text></View>
            </View>
          ))}
          {data.transactions.length === 0 && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '100%' }]}><Text style={styles.tableCell}>No transactions recorded in this period.</Text></View>
            </View>
          )}
        </View>
        {data.transactions.length > 50 && (
          <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 10 }}>* Note: Listing limited to 50 transactions. Please use the Excel export for full ledger.</Text>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated securely via Invixy.</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} of ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
}

