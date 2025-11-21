"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Edit, 
  Send, 
  Download, 
  MoreHorizontal,
  CreditCard,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  Copy,
  Mail,
  Printer
} from "lucide-react";
import Link from "next/link";
import { InvoiceEmailDialog } from "@/components/invoices/invoice-email-dialog";

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
  id: string;
  amount: number;
  taxSystem: {
    id: string;
    name: string;
    taxId: string;
    rate: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: Date;
  method: string;
  reference?: string | null;
  notes?: string | null;
  createdAt: Date;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  dueDate?: Date | null;
  notes?: string | null;
  terms?: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
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
  PARTIAL_PAID: { color: "bg-yellow-500", icon: AlertCircle, label: "Partial" },
  OVERDUE: { color: "bg-red-500", icon: XCircle, label: "Overdue" },
  CANCELLED: { color: "bg-gray-400", icon: XCircle, label: "Cancelled" },
  REFUNDED: { color: "bg-orange-500", icon: XCircle, label: "Refunded" }
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    method: "CASH",
    reference: "",
    notes: ""
  });

  useEffect(() => {
    if (params?.id && currentBusiness?.id) {
      fetchInvoice();
    } else if (!businessLoading) {
      setLoading(false);
    }
  }, [params?.id, currentBusiness?.id, businessLoading]);

  const fetchInvoice = async () => {
    if (!currentBusiness?.id) return;
    
    try {
      const response = await fetch(`/api/invoices/${params?.id}?businessId=${currentBusiness.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        console.error("Failed to fetch invoice");
        router.push("/dashboard/invoices");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      router.push("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (status: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice?.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchInvoice();
      } else {
        alert("Failed to update invoice status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating invoice status");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (parseFloat(paymentForm.amount) > (invoice?.balanceAmount || 0)) {
      alert("Payment amount cannot exceed the balance amount");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice?.id}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentDate: new Date(paymentForm.paymentDate),
          method: paymentForm.method,
          reference: paymentForm.reference || undefined,
          notes: paymentForm.notes || undefined,
        }),
      });

      if (response.ok) {
        setShowPaymentDialog(false);
        setPaymentForm({
          amount: "",
          paymentDate: new Date().toISOString().split('T')[0],
          method: "CASH",
          reference: "",
          notes: ""
        });
        await fetchInvoice();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Error recording payment");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteInvoice = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice?.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/invoices");
      } else {
        alert("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Error deleting invoice");
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const copyInvoiceNumber = () => {
    if (invoice?.invoiceNumber) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
      alert("Invoice number copied to clipboard!");
    }
  };

  const copyPublicLink = () => {
    if (invoice?.id) {
      const publicUrl = `${window.location.origin}/invoices/${invoice.id}`;
      navigator.clipboard.writeText(publicUrl);
      alert("Public link copied to clipboard!");
    }
  };

  const downloadPDF = async () => {
    if (!invoice?.id) return;
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const isDraft = invoice?.status === "DRAFT";
  const canEdit = isDraft;
  const canDelete = isDraft;
  const canRecordPayment = invoice && ["SENT", "VIEWED", "PARTIAL_PAID", "OVERDUE"].includes(invoice.status);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Invoice not found</h2>
          <p className="text-muted-foreground mt-2">The requested invoice could not be found.</p>
          <Link href="/dashboard/invoices">
            <Button className="mt-4">Back to Invoices</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Invoice #{invoice.invoiceNumber}
                </h1>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-muted-foreground">
                Created on {formatDate(invoice.createdAt)}
                {invoice.dueDate && ` • Due ${formatDate(invoice.dueDate)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canRecordPayment && (
              <Button onClick={() => setShowPaymentDialog(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            )}

            {invoice.customer.email && (
              <Button 
                variant="outline" 
                onClick={() => setShowEmailDialog(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Invoice
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={actionLoading}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={copyInvoiceNumber}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Invoice Number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyPublicLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Public Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEmailDialog(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isDraft && (
                  <DropdownMenuItem onClick={() => updateInvoiceStatus("SENT")}>
                    <Send className="h-4 w-4 mr-2" />
                    Mark as Sent
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Invoice
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Invoice
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium text-lg">{invoice.customer.name}</div>
                  {invoice.customer.email && (
                    <div className="text-muted-foreground">{invoice.customer.email}</div>
                  )}
                  {invoice.customer.phone && (
                    <div className="text-muted-foreground">{invoice.customer.phone}</div>
                  )}
                  {invoice.customer.address && (
                    <div className="text-muted-foreground whitespace-pre-line">
                      {invoice.customer.address}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Line Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
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
                                Product: {item.product.name}
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
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoice.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {invoice.notes}
                      </p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <h4 className="font-medium mb-2">Terms & Conditions</h4>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {invoice.terms}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            {invoice.payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.reference || "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>

                  {invoice.taxes.length > 0 && (
                    <>
                      {invoice.taxes.map((tax) => (
                        <div key={tax.id} className="flex justify-between text-sm">
                          <span>
                            {tax.taxSystem.name} ({(tax.taxSystem.rate * 100).toFixed(2)}%):
                          </span>
                          <span>{formatCurrency(tax.amount)}</span>
                        </div>
                      ))}
                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>

                  {invoice.paidAmount > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-green-600">
                        <span>Paid:</span>
                        <span className="font-medium">-{formatCurrency(invoice.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Balance:</span>
                        <span className={invoice.balanceAmount > 0 ? "text-red-600" : "text-green-600"}>
                          {formatCurrency(invoice.balanceAmount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span className="font-medium">#{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span>{formatDate(invoice.issueDate)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span>{invoice.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDate(invoice.updatedAt)}</span>
                  </div>
                  <Separator className="my-3" />
                  <div>
                    <span className="text-muted-foreground block mb-2">Public Link:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={copyPublicLink}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Link to Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for Invoice #{invoice.invoiceNumber}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayment}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={invoice.balanceAmount}
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum: {formatCurrency(invoice.balanceAmount)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={paymentForm.method} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, method: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    placeholder="Transaction ID, check number, etc."
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this payment..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Recording...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete Invoice #{invoice.invoiceNumber}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteInvoice} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Invoice
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <InvoiceEmailDialog
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          customerEmail={invoice.customer.email || ""}
          customerName={invoice.customer.name}
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          onSuccess={fetchInvoice}
        />
      </div>
    </DashboardLayout>
  );
}