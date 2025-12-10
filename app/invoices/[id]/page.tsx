"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send
} from "lucide-react";

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
  }[];
  product?: {
    id: string;
    name: string;
    unit: string;
  } | null;
}

interface InvoiceTax {
  taxSystemId: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string | null;
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
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    billingAddress?: string | null;
  };
  business: {
    id: string;
    name: string;
    email: string;
    phone: string;
    billingAddress: string;
    logo?: string | null;
  };
  items: InvoiceItem[];
  taxes: InvoiceTax[];
  payments: Payment[];
}

const statusConfig = {
  DRAFT: { color: "bg-gray-500", icon: FileText, label: "Draft" },
  SENT: { color: "bg-blue-500", icon: Send, label: "Sent" },
  VIEWED: { color: "bg-purple-500", icon: Clock, label: "Viewed" },
  PAID: { color: "bg-green-500", icon: CheckCircle, label: "Paid" },
  PARTIAL_PAID: { color: "bg-yellow-500", icon: AlertCircle, label: "Partially Paid" },
  OVERDUE: { color: "bg-red-500", icon: XCircle, label: "Overdue" },
  CANCELLED: { color: "bg-gray-400", icon: XCircle, label: "Cancelled" },
  REFUNDED: { color: "bg-orange-500", icon: XCircle, label: "Refunded" }
};

export default function PublicInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchInvoice();
    }
  }, [params?.id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params?.id}/public`);
      
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
        
        // Mark as viewed if not already
        if (data.status === 'SENT') {
          await fetch(`/api/invoices/${params?.id}/view`, {
            method: 'POST'
          });
        }
      } else {
        setError("Invoice not found or access denied");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground">
            {error || "The requested invoice could not be found or you don't have permission to view it."}
          </p>
        </div>
      </div>
    );
  }

  const balanceAmount = invoice.totalAmount - invoice.paidAmount;
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && balanceAmount > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {invoice.business.logo && (
                <img 
                  src={invoice.business.logo} 
                  alt={invoice.business.name}
                  className="h-12 mb-4"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-900">
                {invoice.business.name}
              </h1>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <div>{invoice.business.email}</div>
                <div>{invoice.business.phone}</div>
                <div className="whitespace-pre-line">{invoice.business.billingAddress}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900 mb-2">INVOICE</div>
              <div className="text-lg font-medium text-gray-700 mb-2">
                #{invoice.invoiceNumber}
              </div>
              {getStatusBadge(invoice.status)}
            </div>
          </div>

          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-red-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  This invoice is overdue. Payment was due on {formatDate(invoice.dueDate!)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bill To */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Bill To
              </h3>
              <div className="space-y-1">
                <div className="font-medium text-gray-900">{invoice.customer.name}</div>
                {invoice.customer.email && (
                  <div className="text-sm text-gray-600">{invoice.customer.email}</div>
                )}
                {invoice.customer.phone && (
                  <div className="text-sm text-gray-600">{invoice.customer.phone}</div>
                )}
                {invoice.customer.billingAddress && (
                  <div className="text-sm text-gray-600 whitespace-pre-line">
                    {invoice.customer.billingAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Invoice Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-medium">{formatDate(invoice.issueDate)}</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-medium">{invoice.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.description}</div>
                        {item.product && (
                          <div className="text-sm text-muted-foreground">
                            {item.product.name}
                          </div>
                        )}
                        {item.itemTaxes && item.itemTaxes.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Taxes: {item.itemTaxes.map((tax, idx) => (
                              <span key={tax.taxSystemId}>
                                {idx > 0 && ", "}
                                {(tax.taxRate * 100).toFixed(2)}%
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                      {item.product && (
                        <span className="text-muted-foreground ml-1">
                          {item.product.unit}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.discount > 0 ? formatCurrency(item.discount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.taxAmount > 0 ? formatCurrency(item.taxAmount) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.lineTotal + item.taxAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Totals & Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <div className="font-medium">{formatDate(payment.paymentDate)}</div>
                      <div className="text-gray-600">
                        {payment.paymentMethod}
                        {payment.reference && ` - ${payment.reference}`}
                      </div>
                    </div>
                    <div className="font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Total */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Total</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.totalTax > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span>{formatCurrency(invoice.totalTax)}</span>
                  </div>
                  <Separator />
                </>
              )}

              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>

              {invoice.paidAmount > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span className="font-medium">-{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Balance Due:</span>
                    <span className={balanceAmount > 0 ? "text-red-600" : "text-green-600"}>
                      {formatCurrency(balanceAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
                <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Terms & Conditions
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Thank you for your business!</p>
          <p className="mt-1">
            If you have any questions, please contact {invoice.business.email}
          </p>
        </div>
      </div>
    </div>
  );
}
