"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  Settings as SettingsIcon,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    subscriptionPlan: "FREE",
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
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold">No Business Selected</h3>
            <p className="mb-4 text-muted-foreground">
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
      currency: currentBusiness.currency || "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInvoiceStatusBadgeClass = (status: string) => {
    if (status === "PAID") {
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
    }
    if (status === "SENT") {
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
    }
    if (status === "CANCELLED") {
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800";
    }
    return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800";
  };

  const formatInvoiceStatus = (status: string) => {
    return status
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const atRiskRevenue = stats.pendingRevenue;
  const computedTotalInvoices =
    stats.draftInvoices + stats.pendingInvoices + stats.paidInvoices;
  const totalInvoicesCount =
    stats.totalInvoices > 0 ? stats.totalInvoices : computedTotalInvoices;
  const openInvoicesCountRaw = stats.pendingInvoices;
  const openInvoicesCount = Math.min(openInvoicesCountRaw, totalInvoicesCount);

  const growthPrefix = stats.revenueGrowth >= 0 ? "+" : "";
  const growthLabel = `${growthPrefix}${stats.revenueGrowth.toFixed(1)}%`;
  const getDueDateLabel = (dueDate: string | null | undefined) => {
    if (!dueDate) return "-";
    return formatDate(dueDate);
  };

  const getKpiPillClass = (tone: "positive" | "warning" | "neutral") => {
    if (tone === "positive") {
      return "bg-[var(--brand-teal)]/12 text-[var(--brand-teal)]";
    }
    if (tone === "warning") {
      return "bg-destructive/10 text-destructive";
    }
    return "bg-muted text-muted-foreground";
  };

  const downloadCsv = (fileName: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (value: string | number) => {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes("\n") || text.includes('"')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const handleExportReport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const businessName = (currentBusiness?.name || "business").replace(/\s+/g, "-").toLowerCase();

    const summaryRows = [
      ["Metric", "Value"],
      ["Business", currentBusiness?.name || "-"],
      ["Total Revenue", stats.totalRevenue],
      ["Paid Revenue", stats.paidRevenue],
      ["Pending Revenue", stats.pendingRevenue],
      ["Total Invoices", totalInvoicesCount],
      ["Draft Invoices", stats.draftInvoices],
      ["Open Invoices", openInvoicesCount],
      ["Paid Invoices", stats.paidInvoices],
      ["Cancelled Invoices", Math.max(totalInvoicesCount - stats.draftInvoices - stats.pendingInvoices - stats.paidInvoices, 0)],
      ["Total Customers", stats.totalCustomers],
      ["Total Products", stats.totalProducts],
      ["Revenue Growth (%)", stats.revenueGrowth.toFixed(2)],
      ["This Month Revenue", stats.thisMonthRevenue],
      ["Last Month Revenue", stats.lastMonthRevenue],
      ["Average Invoice Value", stats.avgInvoiceValue],
    ];

    const invoiceRows = [
      ["Invoice Number", "Customer", "Issue Date", "Due Date", "Status", "Total Amount"],
      ...recentInvoices.map((invoice) => [
        invoice.invoiceNumber,
        invoice.customer.name,
        formatDate(invoice.issueDate),
        getDueDateLabel(invoice.dueDate),
        invoice.status,
        invoice.totalAmount,
      ]),
    ];

    const customerRows = [
      ["Customer", "Email", "Invoice Count", "Total Spent"],
      ...topCustomers.map((customer) => [
        customer.name,
        customer.email || "-",
        customer.invoiceCount,
        customer.totalSpent,
      ]),
    ];

    const toCsv = (rows: Array<Array<string | number>>) => rows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n");

    const csv = [
      "Dashboard Summary",
      toCsv(summaryRows),
      "",
      "Recent Invoices",
      toCsv(invoiceRows),
      "",
      "Top Customers",
      toCsv(customerRows),
    ].join("\n");

    downloadCsv(`${businessName}-dashboard-report-${today}.csv`, csv);
  };

  const kpiCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      meta: "Revenue booked across invoices",
      pill: growthLabel,
      icon: DollarSign,
      tone: "positive",
    },
    {
      label: "Outstanding",
      value: formatCurrency(atRiskRevenue),
      meta: `${openInvoicesCount} open invoices (sent)`,
      pill: `${openInvoicesCount} Open`,
      icon: TrendingDown,
      tone: "warning",
    },
    {
      label: "Total Invoices",
      value: totalInvoicesCount.toLocaleString(),
      meta: `${stats.thisMonthInvoices} created this month`,
      pill: `${totalInvoicesCount} Total`,
      icon: FileText,
      tone: "neutral",
    },
  ] as const;

  const elevatedCardShadow =
    "shadow-[0_12px_28px_-18px_rgba(15,23,42,0.35)] dark:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.85)]";

  return (
    <DashboardLayout>
      <div className="rounded-[28px] bg-muted/35 p-2 dark:bg-zinc-900/40 md:p-3">
        <div className="space-y-4">
        <div className={`flex flex-col gap-4 rounded-[24px] border border-border bg-card px-5 py-4 ${elevatedCardShadow} sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <h1 className="text-[2.15rem] font-bold tracking-tight text-foreground">Financial Health</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back. {currentBusiness.name} is up{" "}
              <span className="ml-1 font-semibold text-[var(--brand-teal)]">
                {growthLabel}
              </span>
              {" "}this month.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-10 rounded-md border-border/70 bg-background px-4" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Link href="/dashboard/invoices/new">
              <Button size="sm" className="h-10 rounded-md bg-[var(--brand-cobalt)] px-5 text-white hover:bg-[var(--brand-indigo)]">
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </Link>
            <Link href="/dashboard/business-settings">
              <Button variant="outline" size="sm" className="h-10 rounded-md border-border/70 bg-background px-4">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className={`rounded-[22px] border-border/80 bg-card ${elevatedCardShadow}`}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="rounded-full bg-muted/80 p-2.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Badge
                      variant="secondary"
                      className={getKpiPillClass(card.tone)}
                    >
                      {card.pill}
                    </Badge>
                  </div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
                  <p className="mt-1.5 text-[2rem] font-bold leading-none tracking-tight text-foreground">{card.value}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{card.meta}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <Card className={`rounded-[24px] border-border/80 xl:col-span-8 ${elevatedCardShadow}`}>
            <CardHeader className="border-b bg-muted/20 px-5 pb-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">Recent Invoice Activity</CardTitle>
                  <CardDescription>Latest billing records and current payment state</CardDescription>
                </div>
                <Link href="/dashboard/invoices">
                  <Button variant="outline" size="sm" className="h-9 rounded-md px-4">
                    View all activity
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading && (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--brand-cobalt)]"></div>
                  Loading...
                </div>
              )}

              {!loading && recentInvoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No invoices yet</p>
                  <p className="mb-4 max-w-[180px] text-xs text-muted-foreground">
                    Create your first invoice to see activity here.
                  </p>
                  <Link href="/dashboard/invoices/new">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  </Link>
                </div>
              )}

              {!loading && recentInvoices.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted/30 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Client</th>
                        <th className="px-5 py-3 text-left font-medium">Invoice #</th>
                        <th className="px-5 py-3 text-left font-medium">Due Date</th>
                        <th className="px-5 py-3 text-left font-medium">Amount</th>
                        <th className="px-5 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentInvoices.slice(0, 3).map((invoice) => (
                        <tr key={invoice.id} className="transition-colors hover:bg-muted/20">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-cobalt)]/12 text-[10px] font-semibold text-[var(--brand-cobalt)]">
                                {invoice.customer.name.slice(0, 2).toUpperCase()}
                              </div>
                              <p className="font-medium text-foreground">{invoice.customer.name}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <Link href={`/dashboard/invoices/${invoice.id}`} className="font-medium text-foreground transition-colors hover:text-[var(--brand-cobalt)]">
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {getDueDateLabel(invoice.dueDate)}
                          </td>
                          <td className="px-5 py-3 font-semibold text-foreground">
                            {formatCurrency(invoice.totalAmount)}
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${getInvoiceStatusBadgeClass(invoice.status)}`}>
                              {formatInvoiceStatus(invoice.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4 xl:col-span-4">
            <Card className={`rounded-[24px] border-[var(--brand-cobalt)]/20 bg-muted/40 ${elevatedCardShadow}`}>
              <CardContent className="space-y-4 p-5">
                <h3 className="text-lg font-semibold text-foreground">Revenue Growth Plan</h3>
                <p className="text-sm text-muted-foreground">
                  You are on <span className="font-semibold text-foreground">{stats.subscriptionPlan || "FREE"}</span>. Upgrade to Pro for deeper forecasting and automation.
                </p>
                <Link href="/pricing">
                  <Button className="h-11 w-full rounded-md bg-[var(--brand-cobalt)] text-white hover:bg-[var(--brand-indigo)]">
                    Explore Pro Features
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className={`rounded-[24px] border-border/80 ${elevatedCardShadow}`}>
              <CardHeader className="border-b bg-muted/20 px-5 pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">Top Clients</CardTitle>
                    <CardDescription>Highest revenue contributors</CardDescription>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading && (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--brand-cobalt)]"></div>
                    Loading...
                  </div>
                )}

                {!loading && topCustomers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No customers yet</p>
                    <p className="mb-4 max-w-[180px] text-xs text-muted-foreground">
                      Create your first customer to populate this section.
                    </p>
                    <Link href="/dashboard/customers/new">
                      <Button size="sm">Add Customer</Button>
                    </Link>
                  </div>
                )}

                {!loading && topCustomers.length > 0 && (
                  <div className="space-y-2.5 p-4">
                    {topCustomers.slice(0, 2).map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-cobalt)]/12 text-[10px] font-bold text-[var(--brand-cobalt)]">
                            {customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/dashboard/customers/${customer.id}`} className="text-sm font-medium text-foreground transition-colors hover:text-[var(--brand-cobalt)]">
                              {customer.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{customer.invoiceCount} invoices</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(customer.totalSpent)}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--brand-teal)]">LTV</p>
                        </div>
                      </div>
                    ))}
                    <Link href="/dashboard/customers">
                      <Button variant="outline" className="mt-1 h-10 w-full rounded-md">
                        Manage All Clients
                        <TrendingUp className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
