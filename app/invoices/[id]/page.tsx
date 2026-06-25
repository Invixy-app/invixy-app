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

const getTotalDiscount = (invoice: Invoice) =>
  invoice.items.reduce((sum, item) => sum + Number(item.discount || 0), 0);

const numberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  if (Number.isNaN(num)) return "";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${convert(n % 100)}` : ""}`;
    if (n < 1000000) return `${convert(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${convert(n % 1000)}` : ""}`;
    if (n < 1000000000) return `${convert(Math.floor(n / 1000000))} Million${n % 1000000 ? ` ${convert(n % 1000000)}` : ""}`;
    return `${convert(Math.floor(n / 1000000000))} Billion${n % 1000000000 ? ` ${convert(n % 1000000000)}` : ""}`;
  };

  return convert(Math.floor(num)).trim();
};

function Template1Html({ invoice }: { invoice: Invoice }) {
  const taxSummaryLines = getTaxSummaryLines(invoice);
  const totalDiscount = getTotalDiscount(invoice);

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
          <p className="text-sm">Currency: {String(invoice.currency || "USD").trim().toUpperCase()}</p>
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
              <th className="py-2 text-right font-medium">Discount</th>
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
                <td className="py-3 text-right">{item.discount ? formatCurrency(item.discount, invoice.currency) : "-"}</td>
                <td className="py-3 text-right">{formatCurrency(item.lineTotal, invoice.currency)}</td>
                <td className="py-3 text-right">
                  {item.taxAmount > 0 ? formatCurrency(item.taxAmount, invoice.currency) : getItemTaxLabel(item) || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-md border-y border-gray-300 py-3">
          {totalDiscount > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span>Discount</span>
              <span>-{formatCurrency(totalDiscount, invoice.currency)}</span>
            </div>
          )}
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
  const totalDiscount = getTotalDiscount(invoice);
  const currencyCode = String(invoice.currency || "USD").trim().toUpperCase();

  return (
    <div className="rounded-lg bg-white p-8 text-[#1f2937] shadow-sm">
      <div className="mb-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-1">
          <p className="text-xl font-bold text-[#111827]">{invoice.business.name}</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.business.billingAddress}</p>
          {invoice.business.email && <p className="text-sm text-gray-700">{invoice.business.email}</p>}
          {invoice.business.phone && <p className="text-sm text-gray-700">{invoice.business.phone}</p>}
          {invoice.business.taxRegistrationNumber && (
            <p className="text-sm text-gray-700">Tax ID: {invoice.business.taxRegistrationNumber}</p>
          )}
        </div>

        <div className="text-left md:text-right">
          <p className="text-3xl font-extrabold uppercase tracking-[0.08em] text-[#111827]">Invoice</p>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p><span className="font-semibold">Invoice No.:</span> {invoice.invoiceNumber}</p>
            <p><span className="font-semibold">Date:</span> {formatDateShort(invoice.issueDate)}</p>
            <p><span className="font-semibold">Due Date:</span> {formatDateShort(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Bill To</p>
          <p className="font-semibold text-[#111827]">{invoice.customer.name}</p>
          {invoice.customer.billingAddress && <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.customer.billingAddress}</p>}
          {invoice.customer.email && <p className="text-sm text-gray-700">{invoice.customer.email}</p>}
          {invoice.customer.phone && <p className="text-sm text-gray-700">{invoice.customer.phone}</p>}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Invoice Meta</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Status:</span> {invoice.status.replace("_", " ")}</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Currency:</span> {currencyCode}</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Payment Terms:</span> {invoice.terms || "-"}</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Payment Due:</span> {formatDateLong(invoice.dueDate)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="rounded bg-gray-100 text-gray-700">
              <th className="px-2 py-2 text-left font-semibold">#</th>
              <th className="px-2 py-2 text-left font-semibold">Description</th>
              <th className="px-2 py-2 text-center font-semibold">Qty</th>
              <th className="px-2 py-2 text-right font-semibold">Price</th>
              <th className="px-2 py-2 text-right font-semibold">Tax</th>
              <th className="px-2 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-2 py-2 align-top text-xs">{index + 1}</td>
                <td className="px-2 py-2 align-top">
                  <p className="font-semibold text-[#111827]">{item.product?.name || item.description}</p>
                  {item.product?.name && item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                </td>
                <td className="px-2 py-2 text-center align-top">{item.quantity}</td>
                <td className="px-2 py-2 text-right align-top">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="px-2 py-2 text-right align-top">{item.taxAmount > 0 ? formatCurrency(item.taxAmount, invoice.currency) : "-"}</td>
                <td className="px-2 py-2 text-right align-top font-semibold">{formatCurrency(item.lineTotal, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end">
        <div className="w-full max-w-md">
          {totalDiscount > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span>Total Discount</span>
              <span>{formatCurrency(totalDiscount, invoice.currency)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 text-sm">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>

          {taxSummaryLines.map((tax, i) => (
            <div key={`${tax.name}-${i}`} className="flex justify-between py-1 text-sm">
              <span>{tax.name} ({(tax.rate * 100).toFixed(1)}%)</span>
              <span className="font-semibold">{formatCurrency(tax.amount, invoice.currency)}</span>
            </div>
          ))}

          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
            <span className="text-base font-bold">Total Due</span>
            <span className="text-lg font-bold text-[#111827]">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded bg-gray-50 px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">Total in Words</p>
        <p className="text-sm font-semibold text-[#111827]">{currencyCode} {numberToWords(invoice.totalAmount)}</p>
      </div>

      {(invoice.notes || invoice.terms) && (
        <div className="mt-6">
          <p className="mb-1 text-sm font-semibold text-[#111827]">Notes / Terms</p>
          {invoice.notes && <p className="text-sm text-gray-700">{invoice.notes}</p>}
          {invoice.terms && <p className="text-sm text-gray-700">{invoice.terms}</p>}
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-3 text-center text-xs text-gray-400">
        This is a system generated invoice and does not require a signature.
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
