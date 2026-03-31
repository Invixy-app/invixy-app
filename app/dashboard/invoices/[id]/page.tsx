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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showError, showSuccess } from "@/lib/alert-store";
import { downloadInvoicePdf } from "@/lib/invoice-client-actions";
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
  Printer,
  ChevronDown,
  Lock
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
  taxSystemId: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  taxSystem?: {
    name: string;
    taxId?: string;
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
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
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
  DRAFT: { color: "bg-muted-foreground", icon: FileText, label: "Draft" },
  SENT: { color: "bg-[var(--brand-cobalt)]", icon: Send, label: "Sent" },
  PAID: { color: "bg-[var(--brand-teal)]", icon: CheckCircle, label: "Paid" },
  CANCELLED: { color: "bg-muted-foreground", icon: XCircle, label: "Cancelled" }
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

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
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteInvoice = async () => {
    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice?.id}?businessId=${currentBusiness.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/invoices");
      } else {
        const errorData = await response.json().catch(() => null);
        showError("Error", errorData?.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const copyInvoiceNumber = () => {
    if (invoice?.invoiceNumber) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
      showSuccess("Success", "Invoice number copied to clipboard!");
    }
  };

  const copyPublicLink = () => {
    if (invoice?.id) {
      const publicUrl = `${window.location.origin}/invoices/${invoice.id}`;
      navigator.clipboard.writeText(publicUrl);
      showSuccess("Success", "Public link copied to clipboard!");
    }
  };

  const downloadPDF = async () => {
    if (!invoice?.id) return;
    
    try {
      await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showError("Error", error instanceof Error ? error.message : "Something went wrong. Please try again.");
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

  // Calculate derived values
  const totalDiscount = invoice?.items.reduce((sum, item) => sum + (item.discount || 0), 0) || 0;
  const balanceAmount = invoice ? invoice.totalAmount - invoice.paidAmount : 0;

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
      <div className="space-y-8">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 " />
                
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
            <Button variant="outline" onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>

            {currentBusiness?.plan === 'FREE' ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button 
                        variant="outline" 
                        disabled={true}
                      >
                       <Lock className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                    </span>
                  </TooltipTrigger>
                   <TooltipContent>
                     <p>Emailing invoices is available on Pro and Enterprise plans.</p>
                   </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setShowEmailDialog(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            )}
            
            {canEdit && (
               <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => updateInvoiceStatus("DRAFT")}>
                  Set as Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateInvoiceStatus("SENT")}>
                  Set as Sent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateInvoiceStatus("PAID")}>
                   Set as Paid
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => updateInvoiceStatus("CANCELLED")}>
                   Set as Cancelled
                </DropdownMenuItem>
                
                 <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={copyInvoiceNumber}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Invoice Number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyPublicLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Public Link
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
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
            <Card className="shadow-sm border-border/80">
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
            <Card className="shadow-sm border-border/80">
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
              <Card className="shadow-sm border-border/80">
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
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span className="font-medium">{formatCurrency(invoice.totalTax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>

                  
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