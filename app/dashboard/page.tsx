"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Package, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertCircle,
  Plus,
  Settings as SettingsIcon,
  Clock,
  Edit,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calculator
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useBusinessContext } from "@/components/business-context";
import Link from "next/link";

interface BusinessDashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalInvoices: number;
  draftInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  revenueGrowth: number;
  customerGrowth: number;
  avgInvoiceValue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  thisMonthInvoices: number;
}

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customer: {
    name: string;
  };
  totalAmount: number;
  status: string;
  dueDate: string;
  issueDate: string;
}

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  invoiceCount: number;
}

export default function DashboardPage() {
  const { currentBusiness } = useBusinessContext();
  const [stats, setStats] = useState<BusinessDashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    totalInvoices: 0,
    draftInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
    revenueGrowth: 0,
    customerGrowth: 0,
    avgInvoiceValue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    thisMonthInvoices: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBusiness) {
      fetchDashboardData();
    }
  }, [currentBusiness]);

  const fetchDashboardData = async () => {
    if (!currentBusiness) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/business/${currentBusiness.id}/dashboard`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setRecentInvoices(data.recentInvoices || []);
        setTopCustomers(data.topCustomers || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentBusiness) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-6 h-6 mr-2" />
                No Business Selected
              </CardTitle>
              <CardDescription>
                Please select a business from the top navigation to view the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/businesses/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Business
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid": return "bg-green-500/10 text-green-700 border-green-200";
      case "pending": return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "overdue": return "bg-red-500/10 text-red-700 border-red-200";
      case "draft": return "bg-gray-500/10 text-gray-700 border-gray-200";
      default: return "bg-blue-500/10 text-blue-700 border-blue-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Business Info and Actions */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Building2 className="w-8 h-8 mr-3 text-primary" />
              {currentBusiness.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentBusiness.description || "Business Dashboard"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/businesses/${currentBusiness.id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Business
              </Button>
            </Link>
          <Link href="/dashboard/business-settings">
            <Button>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Business Settings
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.revenueGrowth >= 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+{stats.revenueGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                  <span className="text-red-600">{stats.revenueGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="ml-1">from last month</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Paid: {formatCurrency(stats.paidRevenue)}  Pending: {formatCurrency(stats.pendingRevenue)}
            </div>
          </CardContent>
        </Card>

        {/* Total Invoices Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <div className="text-xs text-muted-foreground mt-1">
              This month: {stats.thisMonthInvoices}
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge variant="outline" className="bg-green-500/10 text-green-700">
                {stats.paidInvoices} Paid
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                {stats.pendingInvoices} Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Customers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.customerGrowth >= 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">+{stats.customerGrowth}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 mr-1 text-red-600" />
                  <span className="text-red-600">{stats.customerGrowth}%</span>
                </>
              )}
              <span className="ml-1">from last month</span>
            </div>
            <Link href="/dashboard/customers/new" className="mt-2 inline-block">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Customer
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Total Products Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg Invoice Value: {formatCurrency(stats.avgInvoiceValue)}
            </div>
            <Link href="/dashboard/products/new" className="mt-2 inline-block">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Add Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.overdueInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Invoices</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{stats.draftInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Not yet sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices and Top Customers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Invoices
              </CardTitle>
              <Link href="/dashboard/invoices">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>Your latest invoice activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading invoices...
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No invoices yet</p>
                <Link href="/dashboard/invoices/new">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="font-medium hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                        <Badge variant="outline" className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Top Customers
              </CardTitle>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>Your most valuable customers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading customers...
              </div>
            ) : topCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No customers yet</p>
                <Link href="/dashboard/customers/new">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <Link href={`/dashboard/customers/${customer.id}`} className="font-medium hover:underline">
                          {customer.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                        <p className="text-xs text-muted-foreground">{customer.invoiceCount} invoices</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">Total spent</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for managing your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/invoices/new">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
            <Link href="/dashboard/customers/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </Link>
            <Link href="/dashboard/products/new">
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
            <Link href="/dashboard/tax-systems/new">
              <Button variant="outline" className="w-full justify-start">
                <Calculator className="w-4 h-4 mr-2" />
                Add Tax System
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
