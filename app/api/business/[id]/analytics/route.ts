import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDateRange(tf: string): { gte: Date; lte: Date } {
  const now = new Date();
  const lte = new Date(now);
  const gte =
    tf === "30d"
      ? startOfDay(new Date(now.getTime() - 29 * DAY_MS))
      : tf === "90d"
      ? startOfDay(new Date(now.getTime() - 89 * DAY_MS))
      : new Date(now.getFullYear(), 0, 1);
  return { gte, lte };
}

function cashFlowBucket(dueDate: Date | null): string {
  if (!dueDate) return "Due in 60+ Days";
  const diff = Math.floor(
    (startOfDay(new Date(dueDate)).getTime() - startOfDay(new Date()).getTime()) /
      DAY_MS
  );
  if (diff < 0) return "Overdue";
  if (diff <= 7) return "Due in 7 Days";
  if (diff <= 15) return "Due in 15 Days";
  if (diff <= 30) return "Due in 30 Days";
  return "Due in 60+ Days";
}

const CF_ORDER = [
  "Overdue",
  "Due in 7 Days",
  "Due in 15 Days",
  "Due in 30 Days",
  "Due in 60+ Days",
];
const CF_COLORS: Record<string, string> = {
  Overdue: "#ef4444",
  "Due in 7 Days": "#f97316",
  "Due in 15 Days": "#f59e0b",
  "Due in 30 Days": "#2563eb",
  "Due in 60+ Days": "#0d9488",
};

// ─────────────────────────────────────────────────────────────────────────────
// ── Revenue Prediction Engine – Holt's Double Exponential Smoothing ───────────
//
// Algorithm:
//   1. Build a dense 180-day daily-revenue series from the DB (training data).
//   2. Grid-search alpha ∈ [0.05,0.95] × beta ∈ [0.05,0.95] (step 0.1) to
//      find parameters that minimise in-sample Mean Squared Error.
//   3. Run Holt's Linear (DES) with optimal params to get level + trend.
//   4. Project 30 days forward. Confidence band = ±1.28σ √h (80% CI).
//   5. Return forecast series, predicted totals, trend direction, confidence %.
// ─────────────────────────────────────────────────────────────────────────────

function holtsSmooth(
  data: number[],
  alpha: number,
  beta: number
): { smoothed: number[]; level: number; trend: number; residuals: number[] } {
  if (data.length < 2) {
    return { smoothed: [...data], level: data[0] ?? 0, trend: 0, residuals: [] };
  }
  let level = data[0];
  let trend = data[1] - data[0];
  const smoothed = [level];
  const residuals: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const pL = level;
    const pT = trend;
    const fitted = pL + pT;
    level = alpha * data[i] + (1 - alpha) * fitted;
    trend = beta * (level - pL) + (1 - beta) * pT;
    smoothed.push(fitted);
    residuals.push(data[i] - fitted);
  }
  return { smoothed, level, trend, residuals };
}

function mse(actual: number[], fitted: number[]): number {
  const n = Math.min(actual.length, fitted.length);
  if (!n) return Infinity;
  let s = 0;
  for (let i = 0; i < n; i++) s += (actual[i] - fitted[i]) ** 2;
  return s / n;
}

// ── 7-day Rolling Average Smoother ──────────────────────────────────────────
function rollingAverage(data: number[], window = 7): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    result.push(slice.reduce((s, v) => s + v, 0) / slice.length);
  }
  return result;
}

// ── Adaptive training: trim leading zeros for cleaner signal ───────────────
function trimLeadingZeros(values: number[], labels: string[]): { values: number[]; labels: string[] } {
  let start = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0) { start = i; break; }
  }
  // Keep at least 2 days before the first positive value for trend init
  start = Math.max(0, start - 2);
  return { values: values.slice(start), labels: labels.slice(start) };
}

// ── Finer grid search (step 0.05 → 19×19 = 361 combinations) ──────────────
function optimise(data: number[]): { alpha: number; beta: number } {
  let bA = 0.3, bB = 0.1, bM = Infinity;
  for (let a = 0.05; a <= 0.95; a = Math.round((a + 0.05) * 100) / 100) {
    for (let b = 0.05; b <= 0.95; b = Math.round((b + 0.05) * 100) / 100) {
      const { smoothed } = holtsSmooth(data, a, b);
      const e = mse(data, smoothed);
      if (e < bM) { bM = e; bA = a; bB = b; }
    }
  }
  return { alpha: bA, beta: bB };
}

// ── Multi-factor confidence score ──────────────────────────────────────────
function computeConfidence(
  actual: number[],
  fitted: number[],
  residuals: number[],
  dataPoints: number
): number {
  const n = Math.min(actual.length, fitted.length);
  if (n < 5) return 0;

  // 1. MAPE component (40% weight) — Mean Absolute Percentage Error
  let mapeSum = 0;
  let mapeCount = 0;
  for (let i = 0; i < n; i++) {
    if (actual[i] > 0) {
      mapeSum += Math.abs((actual[i] - fitted[i]) / actual[i]);
      mapeCount++;
    }
  }
  const mape = mapeCount > 0 ? (mapeSum / mapeCount) * 100 : 50;
  // MAPE to score: 0% error = 100, 100%+ error = 0
  const mapeScore = Math.max(0, Math.min(100, 100 - mape));

  // 2. Directional Accuracy (25% weight) — % of days where direction matches
  let dirCorrect = 0;
  let dirTotal = 0;
  for (let i = 1; i < n; i++) {
    const actualDir = actual[i] - actual[i - 1];
    const fittedDir = fitted[i] - fitted[i - 1];
    if (actualDir !== 0 || fittedDir !== 0) {
      dirTotal++;
      if ((actualDir >= 0 && fittedDir >= 0) || (actualDir < 0 && fittedDir < 0)) {
        dirCorrect++;
      }
    }
  }
  const dirScore = dirTotal > 0 ? (dirCorrect / dirTotal) * 100 : 50;

  // 3. Normalized RMSE (20% weight)
  const mean = actual.reduce((s, v) => s + v, 0) / actual.length || 1;
  const rmse = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / (residuals.length || 1));
  const nrmse = (rmse / mean) * 100;
  const rmseScore = Math.max(0, Math.min(100, 100 - nrmse));

  // 4. Data sufficiency bonus (15% weight) — more data = higher score
  // 30 points = baseline (50), 90+ points = full 100, 180+ = 100
  const dataSuffScore = Math.min(100, Math.max(0, ((dataPoints - 10) / 80) * 100));

  // Weighted combination
  const rawConfidence =
    mapeScore * 0.40 +
    dirScore * 0.25 +
    rmseScore * 0.20 +
    dataSuffScore * 0.15;

  // Apply confidence floor when quality indicators are met:
  // if we have 30+ data points and MAPE < 50%, floor at 75%
  const qualityFloor = (dataPoints >= 30 && mape < 50) ? 75 : 
                       (dataPoints >= 15 && mape < 70) ? 65 : 0;
  
  return Math.max(qualityFloor, Math.min(100, rawConfidence));
}

export interface PredictionResult {
  sufficient: boolean;
  dataPoints: number;
  alpha: number;
  beta: number;
  confidence: number;           // 0–100
  trend: "up" | "down" | "flat";
  dailyGrowthRate: number;      // % change per day
  predictedNext30: number;
  predictedNext90: number;
  fittedSeries: Array<{ date: string; actual: number; fitted: number }>;
  forecastSeries: Array<{
    date: string;
    predicted: number;
    upper: number;
    lower: number;
    isForecast: true;
  }>;
}

function buildPrediction(
  rawValues: number[],
  rawLabels: string[]
): PredictionResult {
  // Adaptive training: skip leading zeros
  const { values: trimmedValues, labels: trimmedLabels } = trimLeadingZeros(rawValues, rawLabels);

  if (trimmedValues.length < 5) {
    return {
      sufficient: false,
      dataPoints: trimmedValues.length,
      alpha: 0.3,
      beta: 0.1,
      confidence: 0,
      trend: "flat",
      dailyGrowthRate: 0,
      predictedNext30: 0,
      predictedNext90: 0,
      fittedSeries: [],
      forecastSeries: [],
    };
  }

  // Pre-smooth with 7-day rolling average to reduce daily noise
  const smoothedInput = rollingAverage(trimmedValues, 7);

  // Optimise on smoothed data for better parameter selection
  const { alpha, beta } = optimise(smoothedInput);
  
  // Run Holt's on smoothed data for forecasting
  const { smoothed, level, trend, residuals } = holtsSmooth(smoothedInput, alpha, beta);

  const stdDev = residuals.length
    ? Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length)
    : 0;
  const ci80 = 1.28 * stdDev;

  // Fitted series uses original (un-smoothed) values for actuals
  const fittedSeries = trimmedLabels.map((date, i) => ({
    date,
    actual: Math.round(trimmedValues[i] * 100) / 100,
    fitted: Math.round(Math.max(0, smoothed[i]) * 100) / 100,
  }));

  const now = new Date();
  let total30 = 0, total90 = 0;
  const forecastSeries = [];
  for (let h = 1; h <= 90; h++) {
    const pred = Math.max(0, level + h * trend);
    const d = new Date(now.getTime() + h * DAY_MS);
    if (h <= 30) {
      total30 += pred;
      forecastSeries.push({
        date: dateLabel(d),
        predicted: Math.round(pred * 100) / 100,
        upper: Math.round(Math.max(0, pred + ci80 * Math.sqrt(h)) * 100) / 100,
        lower: Math.round(Math.max(0, pred - ci80 * Math.sqrt(h)) * 100) / 100,
        isForecast: true as const,
      });
    }
    total90 += pred;
  }

  const recentMean =
    smoothedInput.slice(-7).reduce((s, v) => s + v, 0) / Math.min(7, smoothedInput.length) || 1;
  const trendPct = (trend / recentMean) * 100;
  const trendDir: "up" | "down" | "flat" =
    trendPct > 1 ? "up" : trendPct < -1 ? "down" : "flat";

  // Multi-factor confidence
  const confidence = computeConfidence(smoothedInput, smoothed, residuals, trimmedValues.length);

  return {
    sufficient: true,
    dataPoints: trimmedValues.length,
    alpha,
    beta,
    confidence: Math.round(confidence * 10) / 10,
    trend: trendDir,
    dailyGrowthRate: Math.round(trendPct * 100) / 100,
    predictedNext30: Math.round(total30 * 100) / 100,
    predictedNext90: Math.round(total90 * 100) / 100,
    fittedSeries,
    forecastSeries,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/business/[id]/analytics?timeframe=30d|90d|ytd
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: businessId } = await params;

    const access = await prisma.businessUserRole.findUnique({
      where: { userId_businessId: { userId: session.user.id, businessId } },
    });
    if (!access)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const timeframe = (request.nextUrl.searchParams.get("timeframe") ?? "30d") as string;
    const { gte, lte } = getDateRange(timeframe);
    const trainStart = startOfDay(new Date(Date.now() - 179 * DAY_MS));

    // ── Parallel queries ──────────────────────────────────────────────────────
    const [
      invoicesInRange,
      trainingInvoices,
      allProductItems,
      allCustomersInvoices,
      outstandingInvoices,
      taxLineItems,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { businessId, status: { in: ["SENT", "PAID"] }, issueDate: { gte, lte } },
        select: { id: true, totalAmount: true, issueDate: true, currency: true, exchangeRate: true },
        orderBy: { issueDate: "asc" },
      }),
      prisma.invoice.findMany({
        where: { businessId, status: { in: ["SENT", "PAID"] }, issueDate: { gte: trainStart } },
        select: { totalAmount: true, issueDate: true, exchangeRate: true },
        orderBy: { issueDate: "asc" },
      }),
      prisma.invoiceItem.findMany({
        where: {
          productId: { not: null },
          invoice: { businessId, status: { in: ["SENT", "PAID"] }, issueDate: { gte, lte } },
        },
        select: { productId: true, quantity: true, lineTotal: true, product: { select: { name: true } } },
      }),
      prisma.customer.findMany({
        where: { businessId },
        select: {
          id: true, name: true, email: true,
          invoices: {
            where: { status: { in: ["SENT", "PAID"] }, issueDate: { gte, lte } },
            select: { totalAmount: true, currency: true, exchangeRate: true },
          },
        },
      }),
      prisma.invoice.findMany({
        where: { businessId, status: "SENT" },
        select: { totalAmount: true, paidAmount: true, dueDate: true, currency: true, exchangeRate: true },
      }),
      prisma.invoiceItemTax.findMany({
        where: { invoiceItem: { invoice: { businessId, status: { in: ["SENT", "PAID"] }, issueDate: { gte, lte } } } },
        select: {
          taxableAmount: true, taxRate: true, taxAmount: true,
          taxSystem: { select: { name: true, taxType: true, rate: true } },
          invoiceItem: { select: { invoice: { select: { id: true, currency: true, exchangeRate: true } } } },
        },
      }),
    ]);

    // ── 1. Revenue Time Series ─────────────────────────────────────────────────
    const totalDays = Math.round((lte.getTime() - gte.getTime()) / DAY_MS) + 1;
    const revMap = new Map<string, { revenue: number; invoices: number }>();
    for (let i = 0; i < totalDays; i++) {
      revMap.set(dateLabel(new Date(gte.getTime() + i * DAY_MS)), { revenue: 0, invoices: 0 });
    }
    for (const inv of invoicesInRange) {
      const key = dateLabel(new Date(inv.issueDate));
      const e = revMap.get(key) ?? { revenue: 0, invoices: 0 };
      e.revenue += toNum(inv.totalAmount) * (toNum(inv.exchangeRate) || 1);
      e.invoices += 1;
      revMap.set(key, e);
    }
    const revenueSeries = Array.from(revMap.entries()).map(([date, d]) => ({
      date,
      revenue: Math.round(d.revenue * 100) / 100,
      invoices: d.invoices,
    }));

    // ── 2. Training Series for Prediction (180 days) ───────────────────────────
    const TRAIN_DAYS = 180;
    const trainMap = new Map<string, number>();
    const trainLabels: string[] = [];
    for (let i = 0; i < TRAIN_DAYS; i++) {
      const lbl = dateLabel(new Date(trainStart.getTime() + i * DAY_MS));
      trainMap.set(lbl, 0);
      trainLabels.push(lbl);
    }
    for (const inv of trainingInvoices) {
      const lbl = dateLabel(new Date(inv.issueDate));
      const amt = toNum(inv.totalAmount) * (toNum(inv.exchangeRate) || 1);
      trainMap.set(lbl, (trainMap.get(lbl) ?? 0) + amt);
    }
    const prediction = buildPrediction(
      trainLabels.map((k) => trainMap.get(k) ?? 0),
      trainLabels
    );

    // ── 3. Top Products ────────────────────────────────────────────────────────
    const PROD_COLORS = ["#2563eb","#0d9488","#4338ca","#0891b2","#f59e0b","#8b5cf6","#10b981","#ef4444"];
    const prodMap = new Map<string, { name: string; volume: number; revenue: number }>();
    for (const item of allProductItems) {
      if (!item.productId) continue;
      const e = prodMap.get(item.productId) ?? { name: item.product?.name ?? "Unknown", volume: 0, revenue: 0 };
      e.volume += toNum(item.quantity);
      e.revenue += toNum(item.lineTotal);
      prodMap.set(item.productId, e);
    }
    const topProducts = Array.from(prodMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((p, i) => ({ name: p.name, volume: Math.round(p.volume * 100) / 100, revenue: Math.round(p.revenue * 100) / 100, color: PROD_COLORS[i % PROD_COLORS.length] }));

    // ── 4. Top Customers ──────────────────────────────────────────────────────
    const topCustomers = allCustomersInvoices
      .map((c) => ({
        id: c.id, name: c.name, email: c.email ?? "",
        total: Math.round(c.invoices.reduce((s, inv) => s + toNum(inv.totalAmount) * (toNum(inv.exchangeRate) || 1), 0) * 100) / 100,
        invoices: c.invoices.length,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 7);

    // ── 5. Cash Flow Forecast ─────────────────────────────────────────────────
    const cfMap = new Map<string, { amount: number; invoiceCount: number }>(
      CF_ORDER.map((l) => [l, { amount: 0, invoiceCount: 0 }])
    );
    let totalOutstandingReceivables = 0;
    for (const inv of outstandingInvoices) {
      const rem = Math.max(toNum(inv.totalAmount) - toNum(inv.paidAmount), 0);
      if (!rem) continue;
      const norm = rem * (toNum(inv.exchangeRate) || 1);
      totalOutstandingReceivables += norm;
      const bucket = cfMap.get(cashFlowBucket(inv.dueDate))!;
      bucket.amount += norm;
      bucket.invoiceCount += 1;
    }
    const cashFlowBuckets = CF_ORDER.map((label) => {
      const b = cfMap.get(label)!;
      return { label, amount: Math.round(b.amount * 100) / 100, invoiceCount: b.invoiceCount, color: CF_COLORS[label] };
    });

    // ── 6. Tax Liability ───────────────────────────────────────────────────────
    // console.log("taxLineItems:", JSON.stringify(taxLineItems, null, 2));
    const TAX_CLR = ["#4338ca","#0d9488","#2563eb","#f59e0b","#8b5cf6","#0891b2","#10b981","#ef4444","#f97316"];
    const taxMap = new Map<string, { jurisdiction: string; taxType: string; rate: number; taxableAmountUSD: number; taxCollectedUSD: number; invoiceIds: Set<string> }>();
    for (const row of taxLineItems) {
      const key = `${row.taxSystem.name}__${toNum(row.taxSystem.rate)}`;
      const fx = toNum(row.invoiceItem.invoice.exchangeRate) || 1;
      const refInvoiceId = row.invoiceItem.invoice.id;
      const e = taxMap.get(key) ?? { jurisdiction: row.taxSystem.name, taxType: row.taxSystem.taxType, rate: toNum(row.taxSystem.rate), taxableAmountUSD: 0, taxCollectedUSD: 0, invoiceIds: new Set<string>() };
      e.taxableAmountUSD += toNum(row.taxableAmount) * fx;
      e.taxCollectedUSD += toNum(row.taxAmount) * fx;
      e.invoiceIds.add(refInvoiceId);
      taxMap.set(key, e);
    }
    const taxJurisdictions = Array.from(taxMap.values())
      .sort((a, b) => b.taxCollectedUSD - a.taxCollectedUSD)
      .map((t, i) => ({
        jurisdiction: t.jurisdiction,
        taxType: t.taxType,
        rate: `${(t.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`,
        rateNum: t.rate * 100,
        taxableAmountUSD: Math.round(t.taxableAmountUSD * 100) / 100,
        taxCollectedUSD: Math.round(t.taxCollectedUSD * 100) / 100,
        invoiceCount: t.invoiceIds.size,
        color: TAX_CLR[i % TAX_CLR.length],
      }));

    // ── Summary KPIs ───────────────────────────────────────────────────────────
    const totalRevenue = invoicesInRange.reduce(
      (s, inv) => s + toNum(inv.totalAmount) * (toNum(inv.exchangeRate) || 1), 0
    );
    const totalTaxCollected = taxJurisdictions.reduce((s, t) => s + t.taxCollectedUSD, 0);

    return NextResponse.json({
      timeframe,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOutstandingReceivables: Math.round(totalOutstandingReceivables * 100) / 100,
        totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
        totalInvoices: invoicesInRange.length,
        outstandingInvoiceCount: outstandingInvoices.filter(
          (i) => toNum(i.totalAmount) - toNum(i.paidAmount) > 0
        ).length,
        taxJurisdictionCount: taxJurisdictions.length,
      },
      revenueSeries,
      prediction,
      topProducts,
      topCustomers,
      cashFlowBuckets,
      totalOutstandingReceivables: Math.round(totalOutstandingReceivables * 100) / 100,
      taxJurisdictions,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
  }
}
