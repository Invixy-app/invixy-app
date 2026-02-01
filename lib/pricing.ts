export const PRICING_TIERS = {
  USD: {
    STARTER: { MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 },
    PRO: { MONTHLY: 15, QUARTERLY: 40, YEARLY: 150 },
    ENTERPRISE: { MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 }, // Custom
  },
  INR: {
    STARTER: { MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 },
    PRO: { MONTHLY: 999, QUARTERLY: 2699, YEARLY: 9999 },
    ENTERPRISE: { MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 }, // Custom
  }
} as const;

export type Currency = keyof typeof PRICING_TIERS;
export type PlanId = "STARTER" | "PRO" | "ENTERPRISE";
export type Interval = "MONTHLY" | "QUARTERLY" | "YEARLY";

export function getPrice(currency: string, plan: string, interval: string): number {
  const normCurrency = (currency || "USD").toUpperCase() as Currency;
  const normPlan = (plan || "STARTER").toUpperCase() as PlanId;
  const normInterval = (interval || "MONTHLY").toUpperCase() as Interval;

  const tier = PRICING_TIERS[normCurrency];
  if (!tier) throw new Error("Invalid currency");

  const planTier = tier[normPlan];
  if (!planTier) throw new Error("Invalid plan");

  const price = planTier[normInterval];
  if (price === undefined) throw new Error("Invalid interval");

  return price;
}
