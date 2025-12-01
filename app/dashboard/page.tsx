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
  Calculator,
  Crown
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useBusinessContext } from "@/components/business-context";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  subscriptionPlan?: string;
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
    thisMonthInvoices: 0,
    subscriptionPlan: "FREE"
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
        console.log("Dashboard stats:", data.stats); // Debug log
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
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Business Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a business from the top bar or create a new one.
            </p>
            <Link href="/dashboard/businesses/new">
              <Button>Create your first Business</Button>
            </Link>
          </div>
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
      currency: currentBusiness?.currency || "USD"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Overview for <span className="font-semibold text-foreground">{currentBusiness.name}</span>
              <Badge variant="outline" className="text-xs font-normal">
                Plan: {stats.subscriptionPlan || "Loading..."}
              </Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/businesses/${currentBusiness.id}/edit`}>
              <Button variant="outline" size="sm" className="h-9">
                <Edit className="w-4 h-4 mr-2" />
                Edit Business
              </Button>
            </Link>
            <Link href="/dashboard/business-settings">
              <Button variant="outline" size="sm" className="h-9">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Subscription Alert for Free Plan */}
        {(!stats.subscriptionPlan || stats.subscriptionPlan === "FREE") && (
          <Alert className="bg-primary/5 border-primary/20">
            <Crown className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-semibold">Upgrade to Pro</AlertTitle>
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2 mt-1">
              <span>
                You are currently on the Free plan. Upgrade to Pro to unlock unlimited invoices, custom branding, and more.
              </span>
              <Link href="/pricing">
                <Button size="sm" className="whitespace-nowrap">
                  Upgrade Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue Card */}
          <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stats.revenueGrowth >= 0 ? (
                  <div className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>+{stats.revenueGrowth.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    <span>{stats.revenueGrowth.toFixed(1)}%</span>
                  </div>
                )}
                <span className="ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Invoices Card */}
          <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <div className="text-xs text-muted-foreground mt-1 mb-2">
                {stats.thisMonthInvoices} issued this month
              </div>
              <div className="flex gap-2 text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  {stats.paidInvoices} Paid
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  {stats.pendingInvoices} Pending
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Customers Card */}
          <Card className="overflow-hidden border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
              <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  {stats.customerGrowth >= 0 ? (
                    <span className="text-emerald-600 flex items-center">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +{stats.customerGrowth}%
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center">
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                      {stats.customerGrowth}%
                    </span>
                  )}
                  <span className="ml-1">growth</span>
                </div>
                <Link href="/dashboard/customers/new">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                    <Plus className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Total Products Card */}
          <Card className="overflow-hidden border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-muted-foreground">
                  Avg. Value: {formatCurrency(stats.avgInvoiceValue)}
                </div>
                <Link href="/dashboard/products/new">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                    <Plus className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Status Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
                <h3 className="text-2xl font-bold mt-1">{stats.pendingInvoices}</h3>
                <p className="text-xs text-muted-foreground mt-1">Invoices awaiting payment</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <h3 className="text-2xl font-bold mt-1">{stats.overdueInvoices}</h3>
                <p className="text-xs text-muted-foreground mt-1">Invoices past due date</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                <h3 className="text-2xl font-bold mt-1">{stats.draftInvoices}</h3>
                <p className="text-xs text-muted-foreground mt-1">Work in progress</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices and Top Customers */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Invoices */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest invoices generated</CardDescription>
                </div>
                <Link href="/dashboard/invoices">
                  <Button variant="outline" size="sm" className="h-8">
                    View All
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                  Loading...
                </div>
              ) : recentInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No invoices yet</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[180px]">Create your first invoice to see activity here.</p>
                  <Link href="/dashboard/invoices/new">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Invoice
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          invoice.status === 'PAID' ? 'bg-green-500' : 
                          invoice.status === 'PENDING' ? 'bg-yellow-500' : 
                          invoice.status === 'OVERDUE' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <Link href={`/dashboard/invoices/${invoice.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                            {invoice.invoiceNumber}
                          </Link>
                          <p className="text-xs text-muted-foreground">{invoice.customer.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(invoice.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Users className="w-5 h-5 mr-2 text-primary" />
                    Top Customers
                  </CardTitle>
                  <CardDescription>By revenue generated</CardDescription>
                </div>
                <Link href="/dashboard/customers">
                  <Button variant="outline" size="sm" className="h-8">
                    View All
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                  Loading...
                </div>
              ) : topCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No customers yet</p>
                  <Link href="/dashboard/customers/new">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Customer
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-2 ring-background">
                          {index + 1}
                        </div>
                        <div>
                          <Link href={`/dashboard/customers/${customer.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                            {customer.name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{customer.invoiceCount} invoices</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(customer.totalSpent)}</p>
                        <div className="w-16 h-1.5 bg-muted rounded-full mt-1 ml-auto overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${Math.min((customer.totalSpent / (topCustomers[0]?.totalSpent || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-muted/20 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/dashboard/invoices/new">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-primary hover:text-primary-foreground transition-colors border-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
              <Link href="/dashboard/customers/new">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Users className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
              <Link href="/dashboard/products/new">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Package className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
              <Link href="/dashboard/tax-systems/new">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-primary hover:text-primary-foreground transition-colors">
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
