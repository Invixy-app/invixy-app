"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  lineTotal: number;
  itemTaxes?: {
    taxSystemId: string;
    taxableAmount: number;
    taxRate: number;
    taxAmount: number;
    taxSystem?: {
      name: string;
      taxId?: string;
    };
  }[];
  product?: {
    id: string;
    name: string;
    unit: string;
  } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate?: string | null;
  notes?: string | null;
  terms?: string | null;
  currency: string;
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  business: {
    id: string;
    name: string;
    email: string;
    phone: string;
    billingAddress: string;
    logo?: string | null;
    invoiceTemplate?: string | null;
    taxRegistrationNumber?: string | null;
  };
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    billingAddress?: string | null;
  };
  items: InvoiceItem[];
  taxes: {
    taxSystemId: string;
    taxableAmount: number;
    taxRate: number;
    taxAmount: number;
    taxSystem?: {
      name: string;
      taxId?: string;
    };
  }[];
  payments: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string | null;
  }[];
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount);

const formatDateShort = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toISOString().slice(0, 10);
};

const formatDateLong = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const getItemTaxLabel = (item: InvoiceItem) => {
  if (!item.itemTaxes || item.itemTaxes.length === 0 || item.taxAmount <= 0) return "";
  const names = item.itemTaxes
    .map((tax) => tax.taxSystem?.name)
    .filter((name): name is string => Boolean(name && name.trim()));
  return Array.from(new Set(names)).join(", ");
};

const getTaxSummaryLines = (invoice: Invoice) => {
  const itemTaxMap = new Map<string, { name: string; rate: number; amount: number }>();

  invoice.items.forEach((item) => {
    item.itemTaxes?.forEach((tax) => {
      const name = tax.taxSystem?.name?.trim() || "";
      const rate = Number(tax.taxRate);
      const amount = Number(tax.taxAmount);
      if (!name || !(rate > 0) || !(amount > 0)) return;
      const key = `${name}__${rate.toFixed(6)}`;
      const existing = itemTaxMap.get(key);
      if (existing) existing.amount += amount;
      else itemTaxMap.set(key, { name, rate, amount });
    });
  });

  if (itemTaxMap.size > 0) {
    return Array.from(itemTaxMap.values()).map((line) => ({
      ...line,
      taxableBase: line.amount / line.rate,
    }));
  }

  return invoice.taxes.map((tax) => ({
    name: tax.taxSystem?.name || "Tax",
    rate: Number(tax.taxRate),
    amount: Number(tax.taxAmount),
    taxableBase: Number(tax.taxableAmount),
  }));
};

function Template1Html({ invoice }: { invoice: Invoice }) {
  const taxSummaryLines = getTaxSummaryLines(invoice);

  return (
    <div className="rounded-lg bg-white p-7 text-[#1f2937] shadow-sm">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">INVOICE</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="text-base font-bold">{invoice.business.name}</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.business.billingAddress}</p>
          {invoice.business.taxRegistrationNumber && (
            <p className="text-sm text-gray-700">Tax Registration No. {invoice.business.taxRegistrationNumber}</p>
          )}
        </div>
        <div className="text-left md:text-right text-sm text-gray-700">
          <p>{invoice.business.email}</p>
          <p>{invoice.business.phone}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Bill to</p>
          <p className="font-semibold">{invoice.customer.name}</p>
          {invoice.customer.billingAddress && <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.customer.billingAddress}</p>}
          {invoice.customer.email && <p className="text-sm text-gray-700">{invoice.customer.email}</p>}
          {invoice.customer.phone && <p className="text-sm text-gray-700">{invoice.customer.phone}</p>}
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Invoice details</p>
          <p className="text-sm">Invoice no.: {invoice.invoiceNumber}</p>
          <p className="text-sm">Terms: {invoice.terms || "-"}</p>
          <p className="text-sm">Invoice date: {formatDateShort(invoice.issueDate)}</p>
          <p className="text-sm">Due date: {formatDateShort(invoice.dueDate)}</p>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-gray-300">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-700">
              <th className="py-2 text-left font-medium">#</th>
              <th className="py-2 text-left font-medium">Product or service</th>
              <th className="py-2 text-left font-medium">Description</th>
              <th className="py-2 text-center font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Rate</th>
              <th className="py-2 text-right font-medium">Amount</th>
              <th className="py-2 text-right font-medium">Tax</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-300 align-top">
                <td className="py-3">{index + 1}.</td>
                <td className="py-3 font-semibold">{item.product?.name || item.description}</td>
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="py-3 text-right">{formatCurrency(item.lineTotal, invoice.currency)}</td>
                <td className="py-3 text-right">{getItemTaxLabel(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-md border-y border-gray-300 py-3">
          <div className="flex justify-between py-1 text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {taxSummaryLines.map((tax, i) => (
            <div key={`${tax.name}-${i}`} className="flex justify-between py-1 text-sm">
              <span>{`${tax.name} @ ${(tax.rate * 100).toFixed(0)}% on ${formatCurrency(tax.taxableBase, invoice.currency)}`}</span>
              <span>{formatCurrency(tax.amount, invoice.currency)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-gray-300 pt-2">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && <p className="mt-4 text-sm text-gray-700">{invoice.notes}</p>}
    </div>
  );
}

function Template2Html({ invoice }: { invoice: Invoice }) {
  const taxSummaryLines = getTaxSummaryLines(invoice);
  const emptyRows = Math.max(0, 8 - invoice.items.length);

  return (
    <div className="rounded-lg bg-white p-8 text-[#333] shadow-sm">
      <div className="mb-6">
        <p className="text-3xl font-bold uppercase text-[#2F5C96]">{invoice.business.name}</p>
        <p className="text-sm font-bold text-[#2F5C96]">{formatDateLong(new Date().toISOString())}</p>
        <p className="mt-3 text-lg font-bold text-[#2F5C96]">INVOICE #{invoice.invoiceNumber}</p>
      </div>

      <div className="grid grid-cols-1 border border-[#93C5FD] md:grid-cols-2">
        <div className="border-r border-[#93C5FD]">
          <p className="bg-[#DCE6F1] px-3 py-2 text-sm font-bold">Bill to</p>
          <div className="space-y-1 px-3 py-3 text-sm">
            <p><span className="font-semibold">Customer:</span> {invoice.customer.name}</p>
            <p><span className="font-semibold">Address:</span> {invoice.customer.billingAddress || "-"}</p>
            <p><span className="font-semibold">Phone:</span> {invoice.customer.phone || "-"}</p>
          </div>
        </div>
        <div>
          <p className="bg-[#DCE6F1] px-3 py-2 text-sm font-bold">Ship to</p>
          <div className="space-y-1 px-3 py-3 text-sm">
            <p><span className="font-semibold">Recipient:</span> {invoice.customer.name}</p>
            <p><span className="font-semibold">Address:</span> {invoice.customer.billingAddress || "-"}</p>
            <p><span className="font-semibold">Phone:</span> {invoice.customer.phone || "-"}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 border border-t-0 border-[#93C5FD] px-3 py-2 text-sm">
        <p><span className="font-semibold">Payment Due:</span> {formatDateLong(invoice.dueDate)}</p>
        <p><span className="font-semibold">Payment Terms:</span> {invoice.terms || "-"}</p>
      </div>

      <div className="overflow-x-auto border border-[#93C5FD]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#DCE6F1]">
              <th className="px-2 py-2 text-center">Qty.</th>
              <th className="px-2 py-2 text-center">Item#</th>
              <th className="px-2 py-2 text-left">Description</th>
              <th className="px-2 py-2 text-right">Unit price</th>
              <th className="px-2 py-2 text-center">Discount</th>
              <th className="px-2 py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-t border-[#93C5FD]">
                <td className="px-2 py-2 text-center">{item.quantity}</td>
                <td className="px-2 py-2 text-center">{item.product?.id?.slice(0, 8) || "-"}</td>
                <td className="px-2 py-2">{item.description}</td>
                <td className="px-2 py-2 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="px-2 py-2 text-center">{item.discount ? formatCurrency(item.discount, invoice.currency) : ""}</td>
                <td className="px-2 py-2 text-right">{formatCurrency(item.lineTotal, invoice.currency)}</td>
              </tr>
            ))}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-t border-[#93C5FD]">
                <td className="h-8 px-2 py-2" colSpan={6}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-0 flex justify-end">
        <div className="w-full max-w-sm border-x border-b border-[#93C5FD]">
          <div className="flex justify-between border-b border-[#93C5FD] px-3 py-2 text-sm">
            <span>Total Discount</span>
            <span>0</span>
          </div>
          <div className="flex justify-between border-b border-[#93C5FD] px-3 py-2 text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {taxSummaryLines.map((tax, i) => (
            <div key={`${tax.name}-${i}`} className="flex justify-between border-b border-[#93C5FD] px-3 py-2 text-sm">
              <span>Tax ({tax.name})</span>
              <span>{formatCurrency(tax.amount, invoice.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between bg-[#93C5FD] px-3 py-2 font-bold">
            <span>Total</span>
            <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm">
        <p className="font-bold text-[#2F5C96]">Thank you for your business!</p>
        <p className="mt-4 font-semibold">{invoice.business.name}</p>
        <p>{invoice.business.billingAddress}</p>
        <p>{invoice.business.phone} | {invoice.business.email}</p>
      </div>
    </div>
  );
}

export default function PublicInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`/api/invoices/${params?.id}/public`);
        if (!response.ok) {
          setError("Invoice not found or access denied");
          return;
        }
        const data = await response.json();
        setInvoice(data);
      } catch {
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    if (params?.id) run();
  }, [params?.id]);

  const template = useMemo(() => invoice?.business.invoiceTemplate || "TEMPLATE_1", [invoice]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 px-4 py-10 text-center text-gray-600">Loading invoice...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10 text-center text-gray-700">
        {error || "The requested invoice could not be found."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {template === "TEMPLATE_2" ? <Template2Html invoice={invoice} /> : <Template1Html invoice={invoice} />}
      </div>
    </div>
  );
}
