"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showConfirm, showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LIMITS } from "@/lib/constants-limits";
import { InvoiceEmailDialog } from "@/components/invoices/invoice-email-dialog";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Send,
  DollarSign,
  Calendar,
  Download,
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from "lucide-react";
import Link from "next/link";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate?: string | null;
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  payments: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  }[];
}

export default function InvoicesPage() {
  const { currentBusiness, isLoading: businessLoading } = useBusinessContext();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<Invoice | null>(null);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchInvoices(currentBusiness.id);
    } else if (!businessLoading) {
      setLoading(false);
    }
  }, [currentBusiness?.id, businessLoading]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter, activeTab]);

  const fetchInvoices = async (businessId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        console.error("Failed to fetch invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    // Filter by active tab
    if (activeTab !== "all") {
      const tabStatusMap: Record<string, string> = {
        draft: "DRAFT",
        sent: "SENT",
        paid: "PAID",
        overdue: "OVERDUE"
      };
      filtered = filtered.filter(invoice => invoice.status === tabStatusMap[activeTab]);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status dropdown (additional filter)
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    showConfirm(
      "Delete Invoice",
      "Are you sure you want to delete this invoice? This action cannot be undone.",
      async () => {
        try {
          const response = await fetch(`/api/invoices/${invoiceId}?businessId=${currentBusiness.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            setInvoices(invoices.filter(i => i.id !== invoiceId));
            showSuccess("Success", "Invoice deleted successfully");
          } else {
            const errorData = await response.json();
            showError("Error", "Something went wrong. Please try again.");
          }
        } catch (error) {
          console.error("Error deleting invoice:", error);
          showError("Error", "Something went wrong. Please try again.");
        }
      },
      {
        confirmText: "Delete",
        cancelText: "Cancel"
      }
    );
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        setInvoices(invoices.map(inv => 
          inv.id === invoiceId ? { ...inv, status: updatedInvoice.status } : inv
        ));
        showSuccess("Success", "Invoice status updated successfully");
      } else {
        const errorData = await response.json();
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error updating invoice status:", error);
      showError("Error", "Something went wrong. Please try again.");
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf?businessId=${currentBusiness.id}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        globalThis.URL.revokeObjectURL(url);
        a.remove();
        showSuccess("Success", "Invoice PDF downloaded successfully");
      } else {
        const errorData = await response.json();
        showError("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showError("Error", "Something went wrong. Please try again.");
    }
  };

  const handleSendToCustomer = async (invoiceId: string) => {
    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    // Find the invoice
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      showError("Error", "Invoice not found");
      return;
    }

    // Check if customer has email
    if (!invoice.customer.email) {
      showError("Error", "Customer does not have an email address");
      return;
    }

    // Open email dialog
    setSelectedInvoiceForEmail(invoice);
    setEmailDialogOpen(true);
  };

  const handleDuplicateInvoice = async (invoiceId: string) => {
    if (!currentBusiness?.id) {
      showError("Error", "No business selected");
      return;
    }

    try {
      // For now, we'll just show a placeholder message
      // In a real implementation, this would copy the invoice and redirect to edit
      showSuccess("Info", "Duplicate invoice feature will be implemented soon");
    } catch (error) {
      console.error("Error duplicating invoice:", error);
      showError("Error", "Something went wrong. Please try again.");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "sent":
      case "viewed":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "partial_paid":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "default";
      case "sent":
      case "viewed":
        return "secondary";
      case "partial_paid":
        return "outline";
      case "overdue":
        return "destructive";
      case "cancelled":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getDaysOverdue = (dueDate?: string | null) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Calculate stats
  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === "DRAFT").length,
    sent: invoices.filter(i => i.status === "SENT").length,
    paid: invoices.filter(i => i.status === "PAID").length,
    overdue: invoices.filter(i => i.status === "OVERDUE").length,
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    totalPaid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    totalOutstanding: invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0)
  };

  const statusOptions = ["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE", "CANCELLED"];
  
  // Calculate limits
  const currentPlan = currentBusiness?.plan || "FREE";
  const invoiceLimit = LIMITS[currentPlan].INVOICES;
  const canCreateInvoice = invoices.length < invoiceLimit;
  const canSendEmail = LIMITS[currentPlan].CAN_SEND_EMAIL;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentBusiness) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Business Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a business from the top bar or create a new one.
            </p>
            <Link href="/dashboard/businesses/new">
              <Button>Create Your First Business</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Create, manage, and track your invoices
            </p>
          </div>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled={!canCreateInvoice} asChild={canCreateInvoice}>
                    {canCreateInvoice ? (
                      <Link href="/dashboard/invoices/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Link>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {!canCreateInvoice && (
                <TooltipContent side="left">
                  <p>You have reached the limit of {invoiceLimit} invoices for the {currentPlan} plan.</p>
                  <p className="font-semibold text-primary mt-1">Upgrade to Pro for unlimited invoices.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue, currentBusiness?.currency || 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalPaid, currentBusiness?.currency || 'USD')} collected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding, currentBusiness?.currency || 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                {stats.sent + stats.overdue} invoices pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.paid} paid, {stats.overdue} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => {
                  const issueDate = new Date(inv.issueDate);
                  const now = new Date();
                  return issueDate.getMonth() === now.getMonth() && 
                         issueDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Invoices created this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>
              View and manage all your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
                <TabsTrigger value="sent">Sent ({stats.sent})</TabsTrigger>
                <TabsTrigger value="paid">Paid ({stats.paid})</TabsTrigger>
                <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices by number, customer, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <TabsContent value="all" className="space-y-4">
                {filteredInvoices.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Invoice</TableHead>
                          <TableHead className="max-w-[200px]">Customer</TableHead>
                          <TableHead className="w-[120px]">Amount</TableHead>
                          <TableHead className="w-[120px]">Status</TableHead>
                          <TableHead className="w-[120px]">Due Date</TableHead>
                          <TableHead className="w-[120px]">Created</TableHead>
                          <TableHead className="text-right w-[50px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(invoice.status)}
                                <div>
                                  <div className="font-medium">{invoice.invoiceNumber}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div>
                                <div className="font-medium line-clamp-2" title={invoice.customer.name}>{invoice.customer.name}</div>
                                {invoice.customer.email && (
                                  <div className="text-sm text-muted-foreground line-clamp-2 break-all" title={invoice.customer.email}>
                                    {invoice.customer.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {formatCurrency(invoice.totalAmount, invoice.currency)}
                              </div>
                              {invoice.paidAmount > 0 && (
                                <div className="text-sm text-green-600">
                                  {formatCurrency(invoice.paidAmount, invoice.currency)} paid
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(invoice.status)}>
                                {invoice.status.replace('_', ' ')}
                              </Badge>
                              {invoice.status === "OVERDUE" && invoice.dueDate && (
                                <div className="text-xs text-red-600 mt-1">
                                  {getDaysOverdue(invoice.dueDate)} days overdue
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {invoice.dueDate ? (
                                <div className="text-sm">
                                  {formatDate(invoice.dueDate)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No due date</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(invoice.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <Link href={`/dashboard/invoices/${invoice.id}`}>
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Invoice
                                    </DropdownMenuItem>
                                  </Link>
                                  <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Invoice
                                    </DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuItem onClick={() => handleDuplicateInvoice(invoice.id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDownloadPDF(invoice.id)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                  </DropdownMenuItem>
                                  {canSendEmail ? (
                                    <DropdownMenuItem onClick={() => handleSendToCustomer(invoice.id)}>
                                      <Send className="h-4 w-4 mr-2" />
                                      Send to Customer
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem disabled>
                                      <Send className="h-4 w-4 mr-2" />
                                      Send to Customer (Pro)
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {invoice.status === "DRAFT" && (
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusUpdate(invoice.id, "SENT")}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Mark as Sent
                                    </DropdownMenuItem>
                                  )}
                                  {invoice.status !== "PAID" && invoice.totalAmount > invoice.paidAmount && (
                                    <Link href={`/dashboard/invoices/${invoice.id}/payment`}>
                                      <DropdownMenuItem>
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        Record Payment
                                      </DropdownMenuItem>
                                    </Link>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || statusFilter ? "No invoices found" : "No invoices yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || statusFilter
                        ? "Try adjusting your search terms or filters" 
                        : "Create your first invoice to get started"
                      }
                    </p>
                    {!(searchTerm || statusFilter) && (
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <span>
                              <Button disabled={!canCreateInvoice} asChild={canCreateInvoice}>
                                {canCreateInvoice ? (
                                  <Link href="/dashboard/invoices/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Invoice
                                  </Link>
                                ) : (
                                  <span className="flex items-center">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Invoice
                                  </span>
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!canCreateInvoice && (
                             <TooltipContent>
                               <p>Limit reached on {currentPlan} plan.</p>
                             </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Additional tab contents for different statuses */}
              {["draft", "sent", "paid", "overdue"].map((status) => (
                <TabsContent key={status} value={status} className="space-y-4">
                  {filteredInvoices.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Invoice</TableHead>
                            <TableHead className="max-w-[200px]">Customer</TableHead>
                            <TableHead className="w-[120px]">Amount</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead className="w-[120px]">Due Date</TableHead>
                            <TableHead className="w-[120px]">Created</TableHead>
                            <TableHead className="text-right w-[50px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(invoice.status)}
                                  <div>
                                    <div className="font-medium">{invoice.invoiceNumber}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <div>
                                  <div className="font-medium line-clamp-2" title={invoice.customer.name}>{invoice.customer.name}</div>
                                  {invoice.customer.email && (
                                    <div className="text-sm text-muted-foreground line-clamp-2 break-all" title={invoice.customer.email}>
                                      {invoice.customer.email}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                                </div>
                                {invoice.paidAmount > 0 && (
                                  <div className="text-sm text-green-600">
                                    {formatCurrency(invoice.paidAmount, invoice.currency)} paid
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(invoice.status)}>
                                  {invoice.status.replace('_', ' ')}
                                </Badge>
                                {invoice.status === "OVERDUE" && invoice.dueDate && (
                                  <div className="text-xs text-red-600 mt-1">
                                    {getDaysOverdue(invoice.dueDate)} days overdue
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {invoice.dueDate ? (
                                  <div className="text-sm">
                                    {formatDate(invoice.dueDate)}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No due date</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(invoice.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                                      <DropdownMenuItem>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Invoice
                                      </DropdownMenuItem>
                                    </Link>
                                    <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                                      <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Invoice
                                      </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem onClick={() => handleDuplicateInvoice(invoice.id)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDownloadPDF(invoice.id)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download PDF
                                    </DropdownMenuItem>
                                    {canSendEmail ? (
                                      <DropdownMenuItem onClick={() => handleSendToCustomer(invoice.id)}>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send to Customer
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem disabled>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send to Customer (Pro)
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {invoice.status === "DRAFT" && (
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusUpdate(invoice.id, "SENT")}
                                      >
                                        <Send className="h-4 w-4 mr-2" />
                                        Mark as Sent
                                      </DropdownMenuItem>
                                    )}
                                    {invoice.status !== "PAID" && invoice.totalAmount > invoice.paidAmount && (
                                      <Link href={`/dashboard/invoices/${invoice.id}/payment`}>
                                        <DropdownMenuItem>
                                          <DollarSign className="h-4 w-4 mr-2" />
                                          Record Payment
                                        </DropdownMenuItem>
                                      </Link>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteInvoice(invoice.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No {status} invoices found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || statusFilter
                          ? "Try adjusting your search terms or filters" 
                          : `You don't have any ${status} invoices yet`
                        }
                      </p>
                      {!(searchTerm || statusFilter) && (
                        <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <span>
                              <Button disabled={!canCreateInvoice} asChild={canCreateInvoice}>
                                {canCreateInvoice ? (
                                  <Link href="/dashboard/invoices/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Invoice
                                  </Link>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Invoice
                                  </>
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!canCreateInvoice && (
                             <TooltipContent>
                               <p>Limit reached on {currentPlan} plan.</p>
                             </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Email Dialog */}
      {selectedInvoiceForEmail && (
        <InvoiceEmailDialog
          invoiceId={selectedInvoiceForEmail.id}
          invoiceNumber={selectedInvoiceForEmail.invoiceNumber}
          customerEmail={selectedInvoiceForEmail.customer.email || ""}
          customerName={selectedInvoiceForEmail.customer.name}
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          onSuccess={() => {
            // Refresh invoices after successful email
            if (currentBusiness?.id) {
              fetchInvoices(currentBusiness.id);
            }
            showSuccess("Success", "Invoice emailed successfully");
          }}
        />
      )}
    </DashboardLayout>
  );
}