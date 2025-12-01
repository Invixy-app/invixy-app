"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { showError, showSuccess } from "@/lib/alert-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  User,
  Hash,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  taxId?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoices: number;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  issueDate: string;
  dueDate?: string | null;
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBusiness } = useBusinessContext();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const customerId = params.id as string;

  useEffect(() => {
    if (currentBusiness?.id && customerId) {
      fetchCustomerDetails();
      fetchRecentInvoices();
    }
  }, [currentBusiness?.id, customerId]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}?businessId=${currentBusiness?.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      } else {
        showError("Error", "Failed to fetch customer details");
        router.push("/dashboard/customers");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      showError("Error", "Error loading customer details");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentInvoices = async () => {
    try {
      const response = await fetch(`/api/invoices?businessId=${currentBusiness?.id}&customerId=${customerId}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setRecentInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentBusiness?.currency || 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Customer Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The customer you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/dashboard/customers">
              <Button>Back to Customers</Button>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/customers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={customer.isActive ? "default" : "secondary"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Customer since {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Customer
              </Button>
            </Link>
            <Link href={`/dashboard/invoices/new?customerId=${customer.id}`}>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.taxId && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>Tax ID: {customer.taxId}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created: {formatDate(customer.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Last Updated: {formatDate(customer.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.billingAddress && (
                <div>
                  <h4 className="font-medium mb-1">Billing Address</h4>
                  <p className="text-sm text-muted-foreground">{customer.billingAddress}</p>
                </div>
              )}
              {customer.shippingAddress && (
                <div>
                  <h4 className="font-medium mb-1">Shipping Address</h4>
                  <p className="text-sm text-muted-foreground">{customer.shippingAddress}</p>
                </div>
              )}
              {!customer.billingAddress && !customer.shippingAddress && (
                <p className="text-sm text-muted-foreground">No addresses on file</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {customer.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{customer.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
            <CardDescription>
              Latest invoices for this customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Link 
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="font-medium hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Issued: {formatDate(invoice.issueDate)}
                          {invoice.dueDate && ` • Due: ${formatDate(invoice.dueDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <span className="font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href={`/dashboard/invoices?customerId=${customer.id}`}>
                    <Button variant="outline" className="w-full">
                      View All Invoices
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No invoices yet</p>
                <Link href={`/dashboard/invoices/new?customerId=${customer.id}`}>
                  <Button size="sm">Create First Invoice</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}