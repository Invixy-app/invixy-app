"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useBusinessContext } from "@/components/business-context";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LabelList,
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertCircle,
  Globe2,
  CreditCard,
  BarChart2,
  PieChart as PieChartIcon,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Wallet,
  Loader2,
  RefreshCw,
  FileX,
  Sparkles,
  Target,
  ShieldCheck,
  Minus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Types mirroring the API response shape
// ─────────────────────────────────────────────────────────────────────────────
type Timeframe = "30d" | "90d" | "ytd";

interface RevenuePoint {
  date: string;
  revenue: number;
  invoices: number;
}

interface TopProduct {
  name: string;
  volume: number;
  revenue: number;
  color: string;
}

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  total: number;
  invoices: number;
}

interface CashFlowBucket {
  label: string;
  amount: number;
  invoiceCount: number;
  color: string;
}

interface TaxJurisdiction {
  jurisdiction: string;
  taxType: string;
  rate: string;
  rateNum: number;
  taxableAmountUSD: number;
  taxCollectedUSD: number;
  invoiceCount: number;
  color: string;
}

interface ForecastPoint {
  date: string;
  predicted: number;
  upper: number;
  lower: number;
  isForecast: true;
}

interface Prediction {
  sufficient: boolean;
  dataPoints: number;
  alpha: number;
  beta: number;
  confidence: number;
  trend: "up" | "down" | "flat";
  dailyGrowthRate: number;
  predictedNext30: number;
  predictedNext90: number;
  fittedSeries: Array<{ date: string; actual: number; fitted: number }>;
  forecastSeries: ForecastPoint[];
}

interface AnalyticsData {
  timeframe: Timeframe;
  summary: {
    totalRevenue: number;
    totalOutstandingReceivables: number;
    totalTaxCollected: number;
    totalInvoices: number;
    outstandingInvoiceCount: number;
    taxJurisdictionCount: number;
  };
  revenueSeries: RevenuePoint[];
  prediction: Prediction;
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  cashFlowBuckets: CashFlowBucket[];
  totalOutstandingReceivables: number;
  taxJurisdictions: TaxJurisdiction[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "30d": "Last 30 Days",
  "90d": "Last 3 Months",
  ytd: "Year to Date",
};
const ALL_TIMEFRAMES: Timeframe[] = ["30d", "90d", "ytd"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatCurrency(
  amount: number,
  currency = "USD",
  maximumFractionDigits = 0
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(maximumFractionDigits)}`;
  }
}

function getCurrencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat("en-US", { style: "currency", currency }).formatToParts(0);
    return parts.find(p => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

function tickEvery(data: { date: string }[], count: number): string[] {
  const step = Math.max(1, Math.floor(data.length / count));
  return data.filter((_, i) => i % step === 0).map((d) => d.date);
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip components
// ─────────────────────────────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label, currency = "USD" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-[var(--brand-cobalt)] font-bold">
        {formatCurrency(payload[0]?.value ?? 0, currency)}
      </p>
      <p className="text-muted-foreground text-xs">
        {payload[0]?.payload?.invoices ?? 0} invoices
      </p>
    </div>
  );
};

const CashFlowTooltip = ({ active, payload, label, currency = "USD" }: any) => {
  if (!active || !payload?.length) return null;
  const color = payload[0]?.payload?.color ?? "#2563eb";
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="font-bold" style={{ color }}>
        {formatCurrency(payload[0]?.value ?? 0, currency)}
      </p>
      <p className="text-muted-foreground text-xs">
        {payload[0]?.payload?.invoiceCount ?? 0} invoices
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  badge,
  loading,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  accent: string;
  badge?: string;
  loading?: boolean;
}) {
  return (
    <Card className="rounded-[22px] border-border/80 bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.7)] overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="rounded-full p-2.5"
            style={{ background: `${accent}18` }}
          >
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
          {badge && (
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: `${accent}14`, color: accent }}
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-muted" />
        ) : (
          <p className="mt-1.5 text-[1.8rem] font-bold leading-none tracking-tight text-foreground">
            {value}
          </p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  description,
  accent = "var(--brand-cobalt)",
}: {
  icon: any;
  title: string;
  description?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
        style={{ background: `${accent}18` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FileX className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No data yet</p>
      <p className="max-w-[240px] text-xs text-muted-foreground">{message}</p>
      <Link href="/dashboard/invoices">
        <Button size="sm" variant="outline" className="mt-1">
          Go to Invoices
        </Button>
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence Gauge (SVG arc meter)
// ─────────────────────────────────────────────────────────────────────────────
function ConfidenceGauge({ value, size = 140 }: { value: number; size?: number }) {
  const r = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2 + 4;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (start: number, end: number) => {
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1},${y1} A ${r},${r} 0 ${large},1 ${x2},${y2}`;
  };
  const startA = -210;
  const sweep = 240;
  const fillA = startA + (sweep * Math.min(value, 100)) / 100;
  const color = value >= 80 ? "#0d9488" : value >= 60 ? "#f59e0b" : "#ef4444";
  const label = value >= 80 ? "High" : value >= 60 ? "Medium" : "Low";

  return (
    <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.68}`} className="mx-auto">
      <path d={arc(startA, startA + sweep)} fill="none" stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
      <path
        d={arc(startA, fillA)}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color}60)`, transition: "all 1s ease-out" }}
      />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="var(--foreground)" fontSize={size * 0.24} fontWeight="bold">
        {value}%
      </text>
      <text x={cx} y={cy + size * 0.12} textAnchor="middle" fill={color} fontSize={size * 0.09} fontWeight="600">
        {label} Confidence
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { currentBusiness } = useBusinessContext();
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = currentBusiness?.currency ?? "USD";

  const fetchAnalytics = useCallback(async () => {
    if (!currentBusiness?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/business/${currentBusiness.id}/analytics?timeframe=${timeframe}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to fetch analytics");
      }
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [currentBusiness?.id, timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Derived
  const revenueData = data?.revenueSeries ?? [];
  const ticks = useMemo(() => tickEvery(revenueData, 6), [revenueData]);
  const pred = data?.prediction;

  // Build combined chart data: last 14 days of actual + 30 days forecast
  const forecastChartData = useMemo(() => {
    if (!pred?.sufficient) return [];
    const recentActual = (pred.fittedSeries ?? []).slice(-14).map((p) => ({
      date: p.date,
      actual: p.actual,
      fitted: p.fitted,
      predicted: null as number | null,
      upper: null as number | null,
      lower: null as number | null,
    }));
    const forecast = (pred.forecastSeries ?? []).map((p) => ({
      date: p.date,
      actual: null as number | null,
      fitted: null as number | null,
      predicted: p.predicted,
      upper: p.upper,
      lower: p.lower,
    }));
    // Bridge: connect actual to forecast smoothly
    if (recentActual.length > 0 && forecast.length > 0) {
      const lastActual = recentActual[recentActual.length - 1];
      forecast[0] = { ...forecast[0], actual: lastActual.actual };
    }
    return [...recentActual, ...forecast];
  }, [pred]);

  const forecastTicks = useMemo(
    () => tickEvery(forecastChartData, 6),
    [forecastChartData]
  );

  const trendIcon =
    pred?.trend === "up" ? ArrowUpRight : pred?.trend === "down" ? ArrowDownRight : Minus;
  const trendColor =
    pred?.trend === "up" ? "#0d9488" : pred?.trend === "down" ? "#ef4444" : "#6b7280";
  const trendLabel =
    pred?.trend === "up" ? "Upward" : pred?.trend === "down" ? "Downward" : "Stable";

  const totalTaxCollected = data?.taxJurisdictions.reduce(
    (s, t) => s + t.taxCollectedUSD,
    0
  ) ?? 0;
  const totalTaxableUSD = data?.taxJurisdictions.reduce(
    (s, t) => s + t.taxableAmountUSD,
    0
  ) ?? 0;
  const effectiveTaxRate =
    totalTaxableUSD > 0
      ? ((totalTaxCollected / totalTaxableUSD) * 100).toFixed(2)
      : "0.00";

  // ────────────────────────────────────────────────────────────────────────
  // No business selected
  // ────────────────────────────────────────────────────────────────────────
  if (!currentBusiness) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="mb-2 text-lg font-semibold">No Business Selected</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              Select a business to view financial analytics.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-card px-6 py-5 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.3)] dark:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.8)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="h-6 w-6 text-[var(--brand-cobalt)]" />
              <h1 className="text-[2rem] font-bold tracking-tight text-foreground">
                Financial Reporting & Analytics
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Live business data &bull; Multi-currency &bull; Global tax
              compliance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={fetchAnalytics}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-xl border-border/70 bg-background gap-2"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {TIMEFRAME_LABELS[timeframe]}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {ALL_TIMEFRAMES.map((tf) => (
                  <DropdownMenuItem
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={timeframe === tf ? "bg-muted font-medium" : ""}
                  >
                    {TIMEFRAME_LABELS[tf]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Error banner ───────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 text-destructive border-destructive/30"
              onClick={fetchAnalytics}
            >
              Retry
            </Button>
          </div>
        )}



        {/* ── Loading overlay for charts ────────────────────────────── */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-cobalt)]" />
            <p className="text-sm text-muted-foreground">Loading analytics…</p>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        {(data || !loading) && (
          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList className="h-11 rounded-xl border border-border bg-muted/50 p-1 gap-1">
              <TabsTrigger
                value="performance"
                className="rounded-lg gap-1.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
              >
                <BarChart2 className="h-3.5 w-3.5" />
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="cashflow"
                className="rounded-lg gap-1.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Cash Flow
              </TabsTrigger>
              <TabsTrigger
                value="tax"
                className="rounded-lg gap-1.5 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
              >
                <Globe2 className="h-3.5 w-3.5" />
                Tax Liability
              </TabsTrigger>
            </TabsList>

            {/* ══════════════════════════════════════════════════════════
                TAB 1 – PERFORMANCE
            ══════════════════════════════════════════════════════════ */}
            <TabsContent value="performance" className="space-y-6 mt-0">
              <SectionHeader
                icon={BarChart2}
                title="Performance Dashboard"
                description="Revenue growth, AI-powered forecast, top products & customers"
                accent="#2563eb"
              />

              {/* ── Revenue Prediction Section ──────────────────────────── */}
              {pred?.sufficient && (
                <>
                  {/* Prediction KPI cards + Confidence Gauge */}
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                      icon={Sparkles}
                      label="Predicted Next 30 Days"
                      value={formatCurrency(pred.predictedNext30, currency)}
                      sub="AI-powered DES forecast"
                      accent="#8b5cf6"
                      badge="AI Forecast"
                      loading={loading}
                    />
                    <KpiCard
                      icon={trendIcon}
                      label="Revenue Trend"
                      value={trendLabel}
                      sub={`${pred.dailyGrowthRate > 0 ? "+" : ""}${pred.dailyGrowthRate}% daily`}
                      accent={trendColor}
                      badge={pred.trend === "up" ? "↑ Growing" : pred.trend === "down" ? "↓ Declining" : "→ Stable"}
                      loading={loading}
                    />
                    <KpiCard
                      icon={Target}
                      label="90-Day Outlook"
                      value={formatCurrency(pred.predictedNext90, currency)}
                      sub="Extended projection"
                      accent="#2563eb"
                      loading={loading}
                    />
                    {/* Confidence Gauge Card */}
                    <Card className="rounded-[22px] border-border/80 bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.7)] overflow-hidden">
                      <CardContent className="p-5 flex flex-col items-center justify-center">
                        <ConfidenceGauge value={pred.confidence} size={140} />
                        <p className="text-[10px] text-muted-foreground mt-1 text-center">
                          Trained on {pred.dataPoints} data points
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                            α={pred.alpha}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                            β={pred.beta}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Forecast Chart — Enhanced Visual */}
                  <Card className="rounded-[22px] border-[#8b5cf6]/25 bg-card shadow-[0_8px_32px_-12px_rgba(139,92,246,0.2)] dark:shadow-[0_12px_40px_-16px_rgba(139,92,246,0.15)] relative overflow-hidden">
                    {/* Animated gradient border glow */}
                    <div className="absolute inset-0 rounded-[22px] pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 40%, transparent 60%, rgba(99,102,241,0.06) 100%)", animation: "pulse 4s ease-in-out infinite" }} />
                    <CardHeader className="relative border-b bg-gradient-to-r from-[#8b5cf6]/8 via-[#6366f1]/4 to-transparent px-6 pb-4 pt-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <div className="relative">
                              <Sparkles className="h-5 w-5 text-[#8b5cf6]" />
                              <div className="absolute inset-0 animate-ping" style={{ animationDuration: "3s" }}>
                                <Sparkles className="h-5 w-5 text-[#8b5cf6] opacity-30" />
                              </div>
                            </div>
                            AI Revenue Forecast
                            <Badge className="ml-1 text-[9px] px-2 py-0 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white border-0 font-semibold tracking-wide">PREDICTION</Badge>
                          </CardTitle>
                          <CardDescription>
                            14-day historical + 30-day AI prediction • {getCurrencySymbol(currency)} • {pred.confidence}% confidence
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5 gap-1"
                            style={{ background: `${trendColor}14`, color: trendColor }}
                          >
                            {pred.trend === "up" ? <TrendingUp className="h-3 w-3" /> : pred.trend === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                            {trendLabel} Trend
                          </Badge>
                          <Badge className="text-[10px] px-2.5 py-0.5 font-semibold bg-gradient-to-r from-[#8b5cf6]/15 to-[#6366f1]/10 text-[#8b5cf6] border border-[#8b5cf6]/20">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            {pred.confidence}% Confidence
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart
                          data={forecastChartData}
                          margin={{ top: 30, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="forecastBandGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.22} />
                              <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.10} />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="predictedLineGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="50%" stopColor="#a78bfa" />
                              <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                            <filter id="glowFilter">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                          <XAxis
                            dataKey="date"
                            ticks={forecastTicks}
                            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) => `${getCurrencySymbol(currency)}${(v / 1000).toFixed(0)}k`}
                            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                            width={56}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0]?.payload;
                              const isForecast = d?.predicted !== null && d?.actual === null;
                              return (
                                <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl text-sm">
                                  <p className="font-semibold text-foreground mb-1">{label}</p>
                                  {!isForecast && d?.actual != null && (
                                    <p className="text-[var(--brand-cobalt)] font-bold">
                                      Actual: {formatCurrency(d.actual, currency)}
                                    </p>
                                  )}
                                  {isForecast && d?.predicted != null && (
                                    <>
                                      <p className="text-[#8b5cf6] font-bold">
                                        🔮 Predicted: {formatCurrency(d.predicted, currency)}
                                      </p>
                                      <p className="text-muted-foreground text-xs">
                                        Range: {formatCurrency(d.lower, currency)} – {formatCurrency(d.upper, currency)}
                                      </p>
                                    </>
                                  )}
                                </div>
                              );
                            }}
                          />
                          {/* Confidence band */}
                          <Area type="monotone" dataKey="upper" stroke="none" fill="url(#forecastBandGrad)" dot={false} />
                          <Area type="monotone" dataKey="lower" stroke="none" fill="var(--card)" dot={false} />
                          {/* Actual line */}
                          <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2.5} fill="url(#actualGrad)" dot={false} activeDot={{ r: 5, fill: "#2563eb", stroke: "white", strokeWidth: 2 }} />
                          {/* Predicted line — glowing purple with animated dashes */}
                          <Line type="monotone" dataKey="predicted" stroke="url(#predictedLineGrad)" strokeWidth={3} strokeDasharray="8 4" dot={false} activeDot={{ r: 5, fill: "#8b5cf6", stroke: "white", strokeWidth: 2 }} filter="url(#glowFilter)" />
                          {/* Divider at forecast start */}
                          <ReferenceLine 
                            x={forecastChartData.find(d => d.predicted !== null && d.actual === null)?.date} 
                            stroke="#8b5cf6" 
                            strokeDasharray="4 4" 
                            strokeOpacity={0.6} 
                            label={{ 
                              value: "FORECAST START", 
                              position: "top", 
                              fill: "#8b5cf6", 
                              fontSize: 11, 
                              fontWeight: 800, 
                              dy: -15 
                            }} 
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                      {/* Legend */}
                      {/* Enhanced Legend */}
                      <div className="flex items-center justify-center gap-5 mt-5 text-xs">
                        <span className="flex items-center gap-2 text-foreground">
                          <span className="h-[3px] w-6 rounded-full bg-[#2563eb]" />
                          <span className="font-medium">Historical Revenue</span>
                        </span>
                        <span className="flex items-center gap-2 text-foreground">
                          <span className="h-[3px] w-6 rounded-full" style={{ background: "linear-gradient(90deg, #8b5cf6, #a78bfa, #7c3aed)", boxShadow: "0 0 6px rgba(139,92,246,0.4)" }} />
                          <span className="font-medium">AI Prediction</span>
                        </span>
                        <span className="flex items-center gap-2 text-foreground">
                          <span className="h-4 w-6 rounded" style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.03) 100%)" }} />
                          <span className="font-medium">Confidence Band</span>
                        </span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="h-4 w-[2px] rounded-full bg-[#8b5cf6]/50" style={{ borderLeft: "2px dashed #8b5cf6" }} />
                          <span>Forecast Start</span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Insufficient data notice */}
              {pred && !pred.sufficient && (
                <Card className="rounded-[22px] border-border/80 bg-muted/30">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted shrink-0">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Revenue Prediction Unavailable</p>
                      <p className="text-xs text-muted-foreground">
                        At least 5 days of invoice data are needed to generate a forecast.
                        Currently tracking {pred.dataPoints} day{pred.dataPoints !== 1 ? "s" : ""}.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Revenue Area Chart */}
              <Card className="rounded-[22px] border-border/80 bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)]">
                <CardHeader className="border-b bg-muted/20 px-6 pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Revenue Growth</CardTitle>
                      <CardDescription>
                        {TIMEFRAME_LABELS[timeframe]} &bull; {currency}
                      </CardDescription>
                    </div>
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!loading && revenueData.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[var(--brand-teal)] bg-[var(--brand-teal)]/10 text-xs"
                      >
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Live Data
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {revenueData.length === 0 && !loading ? (
                    <EmptyState message="Issue or send invoices to see your revenue trend here." />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart
                        data={revenueData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="revenueGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#2563eb"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="#2563eb"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          strokeOpacity={0.5}
                        />
                        <XAxis
                          dataKey="date"
                          ticks={ticks}
                          tick={{
                            fontSize: 11,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) =>
                            `${getCurrencySymbol(currency)}${(v / 1000).toFixed(0)}k`
                          }
                          tick={{
                            fontSize: 11,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={52}
                        />
                        <Tooltip content={<RevenueTooltip currency={currency} />} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          fill="url(#revenueGrad)"
                          dot={false}
                          activeDot={{
                            r: 5,
                            strokeWidth: 0,
                            fill: "#2563eb",
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Products + Customers grid */}
              <div className="grid gap-6 xl:grid-cols-2">
                {/* Top Products Donut */}
                <Card className="rounded-[22px] border-border/80 bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)]">
                  <CardHeader className="border-b bg-muted/20 px-6 pb-4 pt-5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-[var(--brand-indigo)]" />
                      Top Products by Revenue
                    </CardTitle>
                    <CardDescription>
                      Share of billed revenue in {TIMEFRAME_LABELS[timeframe]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {(data?.topProducts ?? []).length === 0 && !loading ? (
                      <EmptyState message="Add products to your invoices to see top-selling items here." />
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={data?.topProducts ?? []}
                              cx="50%"
                              cy="50%"
                              innerRadius={58}
                              outerRadius={90}
                              paddingAngle={3}
                              dataKey="revenue"
                            >
                              {(data?.topProducts ?? []).map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(v: any) =>
                                formatCurrency(v, currency)
                              }
                              contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                color: "var(--foreground)",
                                fontSize: "12px",
                              }}
                            />
                            <Legend
                              iconType="circle"
                              iconSize={8}
                              formatter={(value) => (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--muted-foreground)",
                                  }}
                                >
                                  {value}
                                </span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        <div className="w-full space-y-2">
                          {(data?.topProducts ?? []).slice(0, 6).map((p) => (
                            <div
                              key={p.name}
                              className="flex items-center gap-3 text-sm"
                            >
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ background: p.color }}
                              />
                              <span className="flex-1 text-foreground truncate">
                                {p.name}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {p.volume} units
                              </span>
                              <span className="font-semibold text-foreground w-24 text-right">
                                {formatCurrency(p.revenue, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Customers Horizontal Bar */}
                <Card className="rounded-[22px] border-border/80 bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)]">
                  <CardHeader className="border-b bg-muted/20 px-6 pb-4 pt-5">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-[var(--brand-cobalt)]" />
                      Top Customers by Revenue
                    </CardTitle>
                    <CardDescription>
                      Total invoiced amount – {TIMEFRAME_LABELS[timeframe]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {(data?.topCustomers ?? []).length === 0 && !loading ? (
                      <EmptyState message="Send invoices to customers to rank them here." />
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart
                            data={(data?.topCustomers ?? []).slice(0, 6)}
                            layout="vertical"
                            margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
                            barSize={16}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--border)"
                              strokeOpacity={0.4}
                              horizontal={false}
                            />
                            <XAxis
                              type="number"
                              tickFormatter={(v) =>
                                `${(v / 1000).toFixed(0)}k`
                              }
                              tick={{
                                fontSize: 10,
                                fill: "var(--muted-foreground)",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={{
                                fontSize: 11,
                                fill: "var(--foreground)",
                              }}
                              axisLine={false}
                              tickLine={false}
                              width={80}
                            />
                            <Tooltip
                              formatter={(v: any) =>
                                formatCurrency(v, currency)
                              }
                              contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                color: "var(--foreground)",
                                fontSize: "12px",
                              }}
                            />
                            <Bar
                              dataKey="total"
                              radius={[0, 6, 6, 0]}
                            >
                              <LabelList
                                dataKey="total"
                                position="right"
                                formatter={(v: any) =>
                                  `${(v / 1000).toFixed(0)}k`
                                }
                                style={{
                                  fontSize: "10px",
                                  fill: "var(--muted-foreground)",
                                }}
                              />
                              {(data?.topCustomers ?? [])
                                .slice(0, 6)
                                .map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={`hsl(${215 + i * 9}, 72%, ${52 + i * 4}%)`}
                                  />
                                ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>

                        <div className="mt-4 space-y-2">
                          {(data?.topCustomers ?? [])
                            .slice(0, 5)
                            .map((c, i) => (
                              <div
                                key={c.id}
                                className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
                              >
                                <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                                  #{i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {c.name}
                                  </p>
                                  {c.email && (
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {c.email}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-bold text-foreground">
                                    {formatCurrency(c.total, currency)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {c.invoices} inv
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════
                TAB 2 – CASH FLOW
            ══════════════════════════════════════════════════════════ */}
            <TabsContent value="cashflow" className="space-y-6 mt-0">
              <SectionHeader
                icon={CreditCard}
                title="Cash Flow Forecasting"
                description="Projected incoming cash based on your outstanding invoice due dates"
                accent="#f59e0b"
              />

              {/* Outstanding metric + bucket cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="sm:col-span-1 rounded-[22px] border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 shadow-[0_8px_24px_-12px_rgba(245,158,11,0.2)]">
                  <CardContent className="p-6 flex flex-col gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15">
                      <AlertCircle className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Total Outstanding Receivables
                      </p>
                      {loading ? (
                        <div className="mt-2 h-10 w-36 animate-pulse rounded-lg bg-muted" />
                      ) : (
                        <p className="mt-1 text-[2.2rem] font-bold tracking-tight text-foreground">
                          {formatCurrency(
                            data?.totalOutstandingReceivables ?? 0,
                            currency
                          )}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {data?.summary.outstandingInvoiceCount ?? 0} unpaid
                        invoices across {(data?.cashFlowBuckets ?? []).length}{" "}
                        time buckets
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {(data?.cashFlowBuckets ?? []).map((bucket) => (
                    <Card
                      key={bucket.label}
                      className="rounded-[18px] border-border/70 bg-card shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div
                          className="h-2 w-8 rounded-full mb-3"
                          style={{ background: bucket.color }}
                        />
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-tight mb-1">
                          {bucket.label}
                        </p>
                        <p className="text-base font-bold text-foreground">
                          {formatCurrency(bucket.amount, currency)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {bucket.invoiceCount} inv
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Cash Flow Bar Chart */}
              <Card className="rounded-[22px] border-border/80 bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)]">
                <CardHeader className="border-b bg-muted/20 px-6 pb-4 pt-5">
                  <CardTitle className="text-lg">
                    Expected Cash Inflow by Due Date
                  </CardTitle>
                  <CardDescription>
                    Projected revenue from outstanding invoices ({currency})
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {(data?.cashFlowBuckets ?? []).every(
                    (b) => b.amount === 0
                  ) && !loading ? (
                    <EmptyState message="No outstanding invoices found. All payments are up to date!" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={data?.cashFlowBuckets ?? []}
                        margin={{ top: 16, right: 20, left: 0, bottom: 0 }}
                        barSize={52}
                      >
                        <defs>
                          {(data?.cashFlowBuckets ?? []).map((b, i) => (
                            <linearGradient
                              key={i}
                              id={`cfGrad${i}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={b.color}
                                stopOpacity={0.9}
                              />
                              <stop
                                offset="100%"
                                stopColor={b.color}
                                stopOpacity={0.5}
                              />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          strokeOpacity={0.5}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{
                            fontSize: 11,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) =>
                            `${(v / 1000).toFixed(0)}k`
                          }
                          tick={{
                            fontSize: 11,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={52}
                        />
                        <Tooltip content={<CashFlowTooltip currency={currency} />} />
                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                          <LabelList
                            dataKey="amount"
                            position="top"
                            formatter={(v: any) =>
                              v > 0 ? `${(v / 1000).toFixed(0)}k` : ""
                            }
                            style={{
                              fontSize: "11px",
                              fill: "var(--muted-foreground)",
                            }}
                          />
                          {(data?.cashFlowBuckets ?? []).map((_, i) => (
                            <Cell key={i} fill={`url(#cfGrad${i})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══════════════════════════════════════════════════════════
                TAB 3 – TAX LIABILITY
            ══════════════════════════════════════════════════════════ */}
            <TabsContent value="tax" className="space-y-6 mt-0">
              <SectionHeader
                icon={Globe2}
                title="Global Tax Liability Tracking"
                description="Tax grouped by jurisdiction & type — dynamically calculated from your invoices"
                accent="#4338ca"
              />

              {/* Tax KPIs */}
              <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard
                  icon={Landmark}
                  label="Total Tax Collected"
                  value={formatCurrency(totalTaxCollected, currency)}
                  sub={`Across ${data?.summary.taxJurisdictionCount ?? 0} jurisdictions`}
                  accent="#4338ca"
                  loading={loading}
                />
                <KpiCard
                  icon={Globe2}
                  label="Total Taxable Revenue"
                  value={formatCurrency(totalTaxableUSD, currency)}
                  sub="Sum of taxable amounts on invoices"
                  accent="#0d9488"
                  loading={loading}
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Effective Tax Rate"
                  value={`${effectiveTaxRate}%`}
                  sub="Blended across all tax types"
                  accent="#f59e0b"
                  loading={loading}
                />
              </div>

              {/* Tax jurisdiction bar chart */}
              <Card className="rounded-[22px] border-border/80 bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)]">
                <CardHeader className="border-b bg-muted/20 px-6 pb-4 pt-5">
                  <CardTitle className="text-lg">
                    Tax Collected by Jurisdiction
                  </CardTitle>
                  <CardDescription>
                    Amounts normalised using each invoice's exchange rate
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {(data?.taxJurisdictions ?? []).length === 0 && !loading ? (
                    <EmptyState message="No tax data found. Apply tax systems to your invoices to track tax liability here." />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={data?.taxJurisdictions ?? []}
                        margin={{ top: 16, right: 20, left: 0, bottom: 0 }}
                        barSize={40}
                      >
                        <defs>
                          {(data?.taxJurisdictions ?? []).map((t, i) => (
                            <linearGradient
                              key={i}
                              id={`taxGrad${i}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={t.color}
                                stopOpacity={0.9}
                              />
                              <stop
                                offset="100%"
                                stopColor={t.color}
                                stopOpacity={0.5}
                              />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          strokeOpacity={0.5}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="jurisdiction"
                          tick={{
                            fontSize: 10,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis
                          tickFormatter={(v) =>
                            `${(v / 1000).toFixed(0)}k`
                          }
                          tick={{
                            fontSize: 11,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={52}
                        />
                        <Tooltip
                          formatter={(v: any) =>
                            formatCurrency(v, currency)
                          }
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            color: "var(--foreground)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="taxCollectedUSD" radius={[6, 6, 0, 0]}>
                          <LabelList
                            dataKey="taxCollectedUSD"
                            position="top"
                            formatter={(v: any) =>
                              v > 0 ? `${(v / 1000).toFixed(0)}k` : ""
                            }
                            style={{
                              fontSize: "10px",
                              fill: "var(--muted-foreground)",
                            }}
                          />
                          {(data?.taxJurisdictions ?? []).map((_, i) => (
                            <Cell key={i} fill={`url(#taxGrad${i})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Tax Summary Table */}
              <Card className="rounded-[22px] border-border/80 bg-card shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.6)]">
                <CardHeader className="border-b bg-muted/20 px-6 pb-4 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Tax Liability Summary
                      </CardTitle>
                      <CardDescription>
                        Grouped by tax name & type — from your invoice tax
                        records
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs text-[var(--brand-indigo)] bg-[var(--brand-indigo)]/10"
                    >
                      {(data?.taxJurisdictions ?? []).length} Jurisdictions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {(data?.taxJurisdictions ?? []).length === 0 && !loading ? (
                    <div className="px-6 py-8">
                      <EmptyState message="Apply tax systems to your invoices to see a tax liability breakdown." />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-sm">
                        <thead className="bg-muted/30 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          <tr>
                            <th className="px-5 py-3.5 text-left font-medium">
                              Tax System / Jurisdiction
                            </th>
                            <th className="px-5 py-3.5 text-left font-medium">
                              Tax Type
                            </th>
                            <th className="px-5 py-3.5 text-left font-medium">
                              Rate
                            </th>
                            <th className="px-5 py-3.5 text-right font-medium">
                              Taxable Amount
                            </th>
                            <th className="px-5 py-3.5 text-right font-medium">
                              Tax Collected
                            </th>
                            <th className="px-5 py-3.5 text-right font-medium">
                              Invoices
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {(data?.taxJurisdictions ?? []).map((t) => (
                            <tr
                              key={t.jurisdiction}
                              className="transition-colors hover:bg-muted/20"
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="h-3 w-3 rounded-full shrink-0"
                                    style={{ background: t.color }}
                                  />
                                  <span className="font-medium text-foreground">
                                    {t.jurisdiction}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono px-2 py-0.5"
                                  style={{
                                    borderColor: `${t.color}40`,
                                    color: t.color,
                                    background: `${t.color}0e`,
                                  }}
                                >
                                  {t.taxType}
                                </Badge>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-foreground">
                                {t.rate}
                              </td>
                              <td className="px-5 py-3.5 text-right text-muted-foreground">
                                {formatCurrency(t.taxableAmountUSD, currency)}
                              </td>
                              <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                                {formatCurrency(t.taxCollectedUSD, currency)}
                              </td>
                              <td className="px-5 py-3.5 text-right text-muted-foreground">
                                {t.invoiceCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t border-border">
                          <tr>
                            <td
                              className="px-5 py-3.5 font-bold text-foreground"
                              colSpan={3}
                            >
                              Total
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-foreground">
                              {formatCurrency(totalTaxableUSD, currency)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-[var(--brand-cobalt)]">
                              {formatCurrency(totalTaxCollected, currency)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-foreground">
                              {(data?.taxJurisdictions ?? []).reduce(
                                (s, t) => s + t.invoiceCount,
                                0
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                  <div className="px-6 py-3 border-t bg-muted/10 flex items-center gap-2">
                    <Globe2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Amounts are normalised using each invoice&apos;s{" "}
                      <code className="font-mono">exchangeRate</code> field. Set
                      exchange rates on your invoices for accurate multi-currency
                      reporting.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
