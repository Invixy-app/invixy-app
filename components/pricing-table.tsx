"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { showError } from "@/lib/alert-store"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY"

type Currency = "USD" | "INR"

const tiers = {
  USD: [
    {
      name: "Starter",
      id: "starter",
      price: { MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 },
      description: "Perfect for freelancers and small businesses just getting started.",
      features: [
        "Up to 5 active clients",
        "Unlimited invoices",
        "Basic templates",
        "Email support",
      ],
      mostPopular: false,
      buttonText: "Current Plan",
    },
    {
      name: "Pro",
      id: "pro",
      price: { MONTHLY: 15, QUARTERLY: 40, YEARLY: 150 },
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
      buttonText: "Upgrade to Pro",
    },
    {
      name: "Enterprise",
      id: "enterprise",
      price: { MONTHLY: "Custom", QUARTERLY: "Custom", YEARLY: "Custom" },
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
      buttonText: "Contact Sales",
    },
  ],
  INR: [
    {
      name: "Starter",
      id: "starter",
      price: { MONTHLY: 0, QUARTERLY: 0, YEARLY: 0 },
      description: "Perfect for freelancers and small businesses just getting started.",
      features: [
        "Up to 5 active clients",
        "Unlimited invoices",
        "Basic templates",
        "Email support",
      ],
      mostPopular: false,
      buttonText: "Current Plan",
    },
    {
      name: "Pro",
      id: "pro",
      price: { MONTHLY: 999, QUARTERLY: 2699, YEARLY: 9999 },
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
      buttonText: "Upgrade to Pro",
    },
    {
      name: "Enterprise",
      id: "enterprise",
      price: { MONTHLY: "Custom", QUARTERLY: "Custom", YEARLY: "Custom" },
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
      buttonText: "Contact Sales",
    },
  ]
}

interface PricingTableProps {
  mode?: "landing" | "dashboard"
}

export function PricingTable({ mode = "landing" }: PricingTableProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [currency, setCurrency] = useState<Currency>("USD")

  const cycleLabels: Record<BillingCycle, string> = {
    MONTHLY: "mo",
    QUARTERLY: "qtr",
    YEARLY: "yr",
  }

  const currencySymbols: Record<Currency, string> = {
    USD: "$",
    INR: "₹",
  }

  useEffect(() => {
    // Auto-detect currency based on timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timeZone.includes("Kolkata") || timeZone.includes("Mumbai") || timeZone.includes("New_Delhi") || timeZone.includes("India")) {
      setCurrency('INR')
    } else {
      setCurrency('USD')
    }
  }, [])

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleSubscribe = async (tierId: string, price: number | string) => {
    if (tierId === "enterprise" || typeof price !== "number" || price === 0) {
      if (tierId === "starter") {
        if (mode === "landing") router.push("/auth/signup")
        return
      }
      globalThis.location.href = "mailto:sales@invixy.com"
      return
    }

    if (!session) {
      showError("Authentication Required", "Please sign in to subscribe")
      const callbackUrl = mode === "dashboard" ? "/dashboard/subscription" : "/"
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`)
      return
    }

    try {
      setLoadingPlan(tierId)

      const res = await loadRazorpayScript()
      if (!res) {
        showError("Payment Error", "Razorpay SDK failed to load.")
        return
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: tierId.toUpperCase(),
          interval: billingCycle,
          currency: currency,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      const options = {
        key: process.env.NEXT_PUBLIC_RZRPAY_CLIENT_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Invixy App",
        description: `${tierId} Plan - ${billingCycle}`,
        order_id: data.orderId,
        handler: async (response: any) => {
          await fetch("/api/payments/razorpay/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan: tierId.toUpperCase(),
              interval: billingCycle,
            }),
          })
          globalThis.location.href = "/dashboard?payment=success"
        },
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
        theme: { color: "#2563eb" },
      }

      new (globalThis as any).Razorpay(options).open()
    } catch {
      showError("Subscription Failed", "Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Billing Toggle */}
      <Tabs
        defaultValue="MONTHLY"
        onValueChange={(value) => setBillingCycle(value as BillingCycle)}
        className="mt-10 rounded-full border bg-muted/40 p-1"
      >
        <TabsList className="grid grid-cols-3 bg-transparent">
          <TabsTrigger className="rounded-full px-6" value="MONTHLY">
            Monthly
          </TabsTrigger>
          <TabsTrigger className="rounded-full px-6" value="QUARTERLY">
            Quarterly <span className="ml-2 text-xs text-primary">Save 10%</span>
          </TabsTrigger>
          <TabsTrigger className="rounded-full px-6" value="YEARLY">
            Yearly <span className="ml-2 text-xs text-primary">Save 17%</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid w-full grid-cols-1 gap-8 pt-4 md:grid-cols-3 lg:gap-8 text-left">
        {tiers[currency].map((tier) => {
          // @ts-ignore
          const price = tier.price[billingCycle]
          const isCustom = typeof price === "string"

          let buttonText = tier.buttonText
          if (mode === "landing" && tier.id === "starter") {
            buttonText = "Start for free"
          }

          return (
            <Card
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-card p-8 transition-all",
                tier.mostPopular
                  ? "border-primary shadow-xl scale-[1.03]"
                  : "hover:shadow-lg"
              )}
            >
              {tier.mostPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 flex-1">
                <div className="text-3xl font-bold">
                  {isCustom ? (
                    price
                  ) : (
                    <>
                      {currencySymbols[currency]}{price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{cycleLabels[billingCycle]}
                      </span>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={tier.mostPopular ? "default" : "outline"}
                  onClick={() => handleSubscribe(tier.id, price)}
                  disabled={loadingPlan === tier.id || (mode === "dashboard" && tier.id === 'starter')}
                >
                  {loadingPlan === tier.id ? "Processing..." : buttonText}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
