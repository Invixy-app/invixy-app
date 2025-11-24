"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const tiers = [
  {
    name: "Starter",
    id: "tier-starter",
    href: "/auth/signup",
    priceMonthly: "$0",
    description: "Perfect for freelancers and small businesses just getting started.",
    features: [
      "Up to 5 active clients",
      "Unlimited invoices",
      "Basic templates",
      "Email support",
      "Accept payments via Stripe",
    ],
    mostPopular: false,
  },
  {
    name: "Pro",
    id: "tier-pro",
    href: "/auth/signup",
    priceMonthly: "$29",
    description: "Everything you need to scale your business operations.",
    features: [
      "Unlimited clients",
      "Unlimited invoices",
      "Custom branding & templates",
      "Recurring invoices",
      "Automated reminders",
      "Priority support",
      "Multi-currency support",
    ],
    mostPopular: true,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "/contact",
    priceMonthly: "Custom",
    description: "Dedicated support and infrastructure for large organizations.",
    features: [
      "Unlimited everything",
      "Dedicated account manager",
      "Custom API integration",
      "SSO & Advanced Security",
      "SLA guarantees",
      "Custom contracts",
    ],
    mostPopular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your business needs. No hidden fees.
          </p>
        </div>
        <div className="isolate mx-auto grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 ring-1 xl:p-10 ${
                tier.mostPopular
                  ? "bg-primary/5 ring-primary shadow-lg scale-105 relative z-10"
                  : "ring-border bg-card"
              }`}
            >
              {tier.mostPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold leading-6 text-primary-foreground shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={`text-lg font-semibold leading-8 ${
                    tier.mostPopular ? "text-primary" : "text-foreground"
                  }`}
                >
                  {tier.name}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {tier.priceMonthly}
                </span>
                {tier.priceMonthly !== "Custom" && (
                  <span className="text-sm font-semibold leading-6 text-muted-foreground">
                    /month
                  </span>
                )}
              </p>
              <Link href={tier.href} className="w-full">
                <Button
                  variant={tier.mostPopular ? "default" : "outline"}
                  className="mt-6 w-full"
                  aria-describedby={tier.id}
                >
                  {tier.priceMonthly === "Custom" ? "Contact Sales" : "Get started"}
                </Button>
              </Link>
              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground"
              >
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className={`h-6 w-5 flex-none ${
                        tier.mostPopular ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
