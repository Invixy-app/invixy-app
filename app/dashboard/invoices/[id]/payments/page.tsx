"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  CreditCard,
  DollarSign,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Download,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { showError, showSuccess, showConfirm } from "@/lib/alert-store";

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  creator?: {
    name: string;
    email: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  payments: Payment[];
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHECK", label: "Check" },
  { value: "DIGITAL_WALLET", label: "Digital Wallet" },
  { value: "OTHER", label: "Other" },
];

export default function InvoicePaymentsPage() {
  const params = useParams();
  const { data: session } = useSession();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: "CASH",
    reference: "",
    notes: ""
  });

  useEffect(() => {
    if (params?.id) {
      fetchInvoice();
    }
  }, [params?.id]);

  const fetchInvoice = async () => {
    try {
      const businessId = localStorage.getItem("selectedBusinessId");
      const response = await fetch(`/api/invoices/${params?.id}?businessId=${businessId}`);
      
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        showError("Error", "Failed to load invoice");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      showError("Error", "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const validatePaymentForm = () => {
    const amount = parseFloat(paymentForm.amount);
    
    if (!paymentForm.amount || amount <= 0) {
      showError("Validation Error", "Please enter a valid payment amount");
      return false;
    }

    if (!invoice) return false;

    if (amount > invoice.balanceAmount) {
      showError("Validation Error", "Payment amount cannot exceed the balance amount");
      return false;
    }

    if (!paymentForm.paymentDate) {
      showError("Validation Error", "Please select a payment date");
      return false;
    }

    return true;
  };

  const handleAddPayment = async () => {
    if (!validatePaymentForm()) return;

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
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference || undefined,
          notes: paymentForm.notes || undefined,
        }),
      });

      if (response.ok) {
        showSuccess("Success", "Payment recorded successfully");
        resetForm();
        setShowAddPayment(false);
        await fetchInvoice();
      } else {
        const errorData = await response.json();
        showError("Error", errorData.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      showError("Error", "Failed to record payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPayment = async () => {
    if (!validatePaymentForm() || !editingPayment) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice?.id}/payments/${editingPayment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentDate: new Date(paymentForm.paymentDate),
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference || undefined,
          notes: paymentForm.notes || undefined,
        }),
      });

      if (response.ok) {
        showSuccess("Success", "Payment updated successfully");
        resetForm();
        setEditingPayment(null);
        await fetchInvoice();
      } else {
        const errorData = await response.json();
        showError("Error", errorData.error || "Failed to update payment");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      showError("Error", "Failed to update payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayment = (payment: Payment) => {
    showConfirm(
      "Delete Payment",
      `Are you sure you want to delete this payment of ${formatCurrency(payment.amount)}? This action cannot be undone.`,
      async () => {
        setActionLoading(true);
        try {
          const response = await fetch(`/api/invoices/${invoice?.id}/payments/${payment.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            showSuccess("Success", "Payment deleted successfully");
            await fetchInvoice();
          } else {
            const errorData = await response.json();
            showError("Error", errorData.error || "Failed to delete payment");
          }
        } catch (error) {
          console.error("Error deleting payment:", error);
          showError("Error", "Failed to delete payment");
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const startEditPayment = (payment: Payment) => {
    setPaymentForm({
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate.split('T')[0],
      paymentMethod: payment.paymentMethod,
      reference: payment.reference || "",
      notes: payment.notes || ""
    });
    setEditingPayment(payment);
  };

  const resetForm = () => {
    setPaymentForm({
      amount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "CASH",
      reference: "",
      notes: ""
    });
    setEditingPayment(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const paymentMethod = PAYMENT_METHODS.find(pm => pm.value === method);
    return paymentMethod ? paymentMethod.label : method;
  };

  const getPaymentProgress = () => {
    if (!invoice) return 0;
    return (invoice.paidAmount / invoice.totalAmount) * 100;
  };

  const getStatusColor = () => {
    if (!invoice) return "bg-muted-foreground";
    
    switch (invoice.status) {
      case "PAID":
        return "text-green-600";
      case "PARTIAL_PAID":
        return "text-yellow-600";
      case "OVERDUE":
        return "text-destructive";
      default:
        return "text-[var(--brand-cobalt)]";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-cobalt)]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold mt-4">Invoice Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The requested invoice could not be found.
          </p>
          <Link href="/dashboard/invoices">
            <Button className="mt-4">Back to Invoices</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const canAddPayments = ["SENT", "VIEWED", "PARTIAL_PAID", "OVERDUE"].includes(invoice.status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/invoices/${invoice.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Payment Tracking
              </h1>
              <p className="text-muted-foreground">
                Manage payments for Invoice #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          {canAddPayments && (
            <Button onClick={() => setShowAddPayment(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Payment Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Payment Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {getPaymentProgress().toFixed(1)}% paid
                    </span>
                  </div>
                  <Progress value={getPaymentProgress()} className="h-3" />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-[var(--brand-cobalt)]">
                        {formatCurrency(invoice.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Amount</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(invoice.paidAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">Paid Amount</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className={`text-2xl font-bold ${invoice.balanceAmount > 0 ? 'text-destructive' : 'text-[var(--brand-teal)]'}`}>
                        {formatCurrency(invoice.balanceAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">Balance Due</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  All recorded payments for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoice.payments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No payments recorded</h3>
                    <p className="text-muted-foreground mt-2">
                      Payments will appear here once they are recorded
                    </p>
                    {canAddPayments && (
                      <Button className="mt-4" onClick={() => setShowAddPayment(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Record First Payment
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Recorded By</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatDate(payment.paymentDate)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(payment.createdAt)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getPaymentMethodLabel(payment.paymentMethod)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              {payment.reference && (
                                <div className="font-mono text-sm">{payment.reference}</div>
                              )}
                              {payment.notes && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {payment.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {payment.creator?.name || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditPayment(payment)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePayment(payment)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span className="font-medium">#{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor()}>
                      {invoice.status.replace('_', ' ')}
                    </Badge>
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
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{invoice.customer.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/invoices/${invoice.id}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    View Invoice Details
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                {canAddPayments && (
                  <Button size="sm" className="w-full" onClick={() => setShowAddPayment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add/Edit Payment Dialog */}
        <Dialog 
          open={showAddPayment || editingPayment !== null} 
          onOpenChange={(open) => {
            if (!open) {
              setShowAddPayment(false);
              setEditingPayment(null);
              resetForm();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "Edit Payment" : "Record Payment"}
              </DialogTitle>
              <DialogDescription>
                {editingPayment 
                  ? "Update payment details" 
                  : `Record a payment for Invoice #${invoice.invoiceNumber}`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={editingPayment ? undefined : invoice.balanceAmount}
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                  {!editingPayment && (
                    <p className="text-xs text-muted-foreground">
                      Maximum: {formatCurrency(invoice.balanceAmount)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
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
                <Label htmlFor="method">Payment Method *</Label>
                <Select 
                  value={paymentForm.paymentMethod} 
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
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

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddPayment(false);
                  setEditingPayment(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={editingPayment ? handleEditPayment : handleAddPayment} 
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingPayment ? "Updating..." : "Recording..."}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {editingPayment ? "Update Payment" : "Record Payment"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}