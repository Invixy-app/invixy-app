"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
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
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Crown
} from "lucide-react";
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

  const getInvoiceStatusBadgeClass = (status: string) => {
    if (status === "PAID") {
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
    }
    if (status === "PENDING") {
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
    }
    if (status === "OVERDUE") {
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    }
    return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800";
  };

  const collectionRate =
    stats.totalInvoices > 0
      ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100)
      : 0;

  const atRiskRevenue = Math.max(
    stats.totalRevenue - stats.paidRevenue,
    stats.pendingRevenue
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Business Info and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Overview for <span className="font-semibold text-foreground">{currentBusiness.name}</span>
              <Badge variant="outline" className="text-xs font-normal border-[var(--brand-cobalt)]/30 text-[var(--brand-cobalt)] bg-[var(--brand-cobalt)]/10">
                Plan: {stats.subscriptionPlan || "Loading..."}
              </Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/business-settings">
              <Button variant="outline" size="sm" className="h-9 border-[var(--brand-cobalt)]/30 hover:bg-[var(--brand-cobalt)] hover:text-white">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Business Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Subscription Alert for Free Plan */}
        {(!stats.subscriptionPlan || stats.subscriptionPlan === "FREE") && (
          <Alert className="bg-[var(--brand-cobalt)]/10 border-[var(--brand-cobalt)]/30">
            <Crown className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-semibold">Upgrade to Pro</AlertTitle>
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2 mt-1">
              <span>
                You are currently on the Free plan. Upgrade to Pro to unlock unlimited invoices, custom branding, and more.
              </span>
              <Link href="/pricing">
                <Button size="sm" className="whitespace-nowrap bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                  Upgrade Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Bento Grid Metrics Workspace */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          
          {/* Main Revenue Card (Spans 2 columns, maybe 2 rows on large screens) */}
          <Card className="md:col-span-2 xl:col-span-2 xl:row-span-2 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow relative border-[var(--brand-cobalt)]/25 bg-card">
            <CardHeader className="flex flex-row items-start justify-between pb-2 relative z-10">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium text-muted-foreground">Total Revenue</CardTitle>
                <div className="text-4xl md:text-5xl font-bold tracking-tight">
                  {formatCurrency(stats.totalRevenue)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-[var(--brand-cobalt)]/15 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6 text-[var(--brand-cobalt)]" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10 space-y-4">
              <div className="flex items-center text-sm">
                {stats.revenueGrowth >= 0 ? (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-2 py-1">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    +{stats.revenueGrowth.toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-none px-2 py-1">
                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                    {stats.revenueGrowth.toFixed(1)}%
                  </Badge>
                )}
                <span className="text-muted-foreground ml-2">vs last month</span>
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t border-[var(--brand-cobalt)]/15">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Last Month</div>
                  <div className="text-sm font-semibold">{formatCurrency(stats.lastMonthRevenue)}</div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">This Month</div>
                  <div className="text-sm font-semibold">{formatCurrency(stats.thisMonthRevenue)}</div>
                </div>
              </div>
            </CardContent>
            {/* Background decorative elements */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          </Card>

          {/* Invoice Performance Card */}
          <Card className="lg:col-span-1 xl:col-span-1 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-[var(--brand-cobalt)] flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
                <FileText className="h-4 w-4 text-[var(--brand-cobalt)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {stats.thisMonthInvoices} issued this month
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--brand-teal)]">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Paid
                  </div>
                  <span className="font-medium bg-[var(--brand-teal)]/15 px-1.5 py-0.5 rounded text-[var(--brand-teal)]">{stats.paidInvoices}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    Drafts
                  </div>
                  <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{stats.draftInvoices}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Health Card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center bg-[var(--brand-teal)]/10 border-[var(--brand-teal)]/25">
            <CardContent className="p-4 md:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--brand-teal)]">Collection Rate</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{collectionRate}%</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.paidInvoices} paid of {stats.totalInvoices} total
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--brand-teal)]/15 flex items-center justify-center">
                <Activity className="h-5 w-5 text-[var(--brand-teal)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center bg-red-50/50 border-red-200/50 dark:bg-red-950/10 dark:border-red-900/50">
            <CardContent className="p-4 md:p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-500">At Risk Revenue</p>
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-400 mt-1">{formatCurrency(atRiskRevenue)}</h3>
                <p className="text-xs text-red-700/80 dark:text-red-500/80 mt-1">
                  {stats.overdueInvoices} overdue, {stats.pendingInvoices} pending
                </p>
              </div>
              <div className="h-10 w-10 shrink-0 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>

          {/* Customers & Products grouped */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-[var(--brand-indigo)]/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                <Users className="h-4 w-4 text-[var(--brand-indigo)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  <div className="flex items-center text-xs mt-1">
                    {stats.customerGrowth >= 0 ? (
                      <span className="text-emerald-600 flex items-center bg-emerald-50 px-1 py-0.5 rounded">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" />
                        +{stats.customerGrowth}%
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center bg-rose-50 px-1 py-0.5 rounded">
                        <ArrowDownRight className="w-3 h-3 mr-0.5" />
                        {stats.customerGrowth}%
                      </span>
                    )}
                    <span className="text-muted-foreground ml-1">growth</span>
                  </div>
                </div>
                <Link href="/dashboard/customers/new">
                  <Button variant="secondary" size="icon" className="h-7 w-7 rounded-md bg-muted">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow border-[var(--brand-cyan)]/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Invoice Value</CardTitle>
                <DollarSign className="h-4 w-4 text-[var(--brand-cyan)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(stats.avgInvoiceValue)}</div>
                  <div className="text-xs text-muted-foreground mt-1 bg-muted px-1.5 py-0.5 rounded inline-block">
                    Across {stats.totalInvoices} invoices
                  </div>
                </div>
                <Link href="/dashboard/invoices/new">
                  <Button variant="secondary" size="icon" className="h-7 w-7 rounded-md bg-muted">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices and Top Customers */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Recent Invoices - Spans 2 cols on xl screens */}
          <Card className="shadow-sm xl:col-span-2 border-border/80">
            <CardHeader className="border-b bg-muted/20 pb-4">
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
                    View All Invoices
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Loading...
                </div>
              )}
              
              {!loading && recentInvoices.length === 0 && (
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
              )}

              {!loading && recentInvoices.length > 0 && (
                <div className="divide-y">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4 sm:gap-0">
                      <div className="flex items-center gap-4">
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-muted`}>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/invoices/${invoice.id}`} className="font-semibold text-sm hover:text-[var(--brand-cobalt)] transition-colors">
                              {invoice.invoiceNumber}
                            </Link>
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${getInvoiceStatusBadgeClass(invoice.status)}`}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{invoice.customer.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 justify-between sm:justify-end">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(invoice.issueDate)}</p>
                        </div>
                        <div className="text-right w-24">
                          <p className="font-semibold text-sm">{formatCurrency(invoice.totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="shadow-sm xl:col-span-1 border-border/80">
            <CardHeader className="border-b bg-muted/20 pb-4">
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
              {loading && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--brand-cobalt)] mr-2"></div>
                  Loading...
                </div>
              )}
              
              {!loading && topCustomers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No customers yet</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[180px]">Create your first customer to see activity here.</p>
                  <Link href="/dashboard/customers/new">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Customer
                    </Button>
                  </Link>
                </div>
              )}

              {!loading && topCustomers.length > 0 && (
                <div className="divide-y">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-cobalt)]/12 text-xs font-bold text-[var(--brand-cobalt)] ring-2 ring-background">
                          {index + 1}
                        </div>
                        <div>
                          <Link href={`/dashboard/customers/${customer.id}`} className="font-medium text-sm hover:text-[var(--brand-cobalt)] transition-colors">
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
                            className="h-full bg-[var(--brand-cobalt)] rounded-full" 
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
        <Card className="bg-muted/20 border-dashed border-[var(--brand-cobalt)]/25">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/dashboard/invoices/new">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-[var(--brand-cobalt)] hover:text-white transition-colors border-[var(--brand-cobalt)]/25">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
              <Link href="/dashboard/customers/new">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-[var(--brand-cobalt)] hover:text-white transition-colors border-[var(--brand-cobalt)]/25">
                  <Users className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
              <Link href="/dashboard/products/new">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-[var(--brand-cobalt)] hover:text-white transition-colors border-[var(--brand-cobalt)]/25">
                  <Package className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
              <Link href="/dashboard/tax-systems/new">
                <Button variant="outline" className="w-full justify-start bg-background hover:bg-[var(--brand-cobalt)] hover:text-white transition-colors border-[var(--brand-cobalt)]/25">
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
