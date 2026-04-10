const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const taxLineItems = await prisma.invoiceItemTax.findMany({ 
    where: { invoiceItem: { invoice: { status: { in: ['SENT', 'PAID'] } } } }, 
    select: { 
      taxableAmount: true, 
      taxRate: true, 
      taxAmount: true, 
      taxSystem: { select: { name: true, taxType: true, rate: true } }, 
      invoiceItem: { select: { invoice: { select: { id: true, currency: true, exchangeRate: true } } } } 
    } 
  }); 
  const toNum = v => Number.isFinite(Number(v)) ? Number(v) : 0; 
  const taxMap = new Map(); 
  for (const row of taxLineItems) { 
    const key = `${row.taxSystem.name}__${toNum(row.taxSystem.rate)}`; 
    const fx = toNum(row.invoiceItem.invoice.exchangeRate) || 1; 
    const refInvoiceId = row.invoiceItem.invoice.id; 
    const e = taxMap.get(key) ?? { jurisdiction: row.taxSystem.name, taxType: row.taxSystem.taxType, rate: toNum(row.taxSystem.rate), taxableAmountUSD: 0, taxCollectedUSD: 0, invoiceIds: new Set() }; 
    e.taxableAmountUSD += toNum(row.taxableAmount) * fx; 
    e.taxCollectedUSD += toNum(row.taxAmount) * fx; 
    e.invoiceIds.add(refInvoiceId); 
    taxMap.set(key, e); 
  } 
  const taxJurisdictions = Array.from(taxMap.values()).map(t => ({ jurisdiction: t.jurisdiction, invoiceCount: t.invoiceIds.size, taxCollectedUSD: t.taxCollectedUSD })); 
  console.log(JSON.stringify(taxJurisdictions, null, 2)); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());
