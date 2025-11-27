"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { showError } from "@/lib/alert-store"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type BillingCycle = "MONTHLY" | "QUARTERLY" | "YEARLY"

const tiers = [
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
    buttonText: "Start for free",
  },
  {
    name: "Pro",
    id: "pro",
    price: { MONTHLY: 1, QUARTERLY: 1, YEARLY: 1 },
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
    buttonText: "Get Started",
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

export function PricingSection() {
  const { data: session } = useSession()
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (tierId: string, price: number | string) => {
    if (tierId === "enterprise" || typeof price !== "number") {
      if (tierId === "starter") {
        router.push("/auth/signup")
        return
      }
      // Handle enterprise contact or free tier
      window.location.href = "mailto:sales@invixy.com"
      return
    }

    if (!session) {
      showError("Authentication Required", "Please sign in to subscribe")
      router.push("/auth/signin?callbackUrl=/")
      return
    }

    try {
      setLoadingPlan(tierId)
      
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: tierId.toUpperCase(),
          interval: billingCycle,
          price: price,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription")
      }

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      } else {
        throw new Error("No approval URL returned")
      }
    } catch (error) {
      console.error("Subscription error:", error)
      showError("Subscription Failed", "Failed to start subscription process. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" className="container py-24 sm:py-32 px-4 w-full mx-auto">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">
          Simple, transparent pricing
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Choose the plan that&apos;s right for you. All plans include a 14-day free trial.
        </p>
        
        <div className="mt-6 flex items-center justify-center">
          <Tabs defaultValue="MONTHLY" className="w-full max-w-md" onValueChange={(value) => setBillingCycle(value as BillingCycle)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
              <TabsTrigger value="QUARTERLY">
                Quarterly
                <span className="ml-1.5 hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary sm:inline-block">
                  -10%
                </span>
              </TabsTrigger>
              <TabsTrigger value="YEARLY">
                Yearly
                <span className="ml-1.5 hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary sm:inline-block">
                  -17%
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-8 pt-12 md:grid-cols-3 lg:gap-8">
        {tiers.map((tier) => {
          const price = tier.price[billingCycle]
          const isCustom = typeof price === "string"
          
          return (
            <Card 
              key={tier.id} 
              className={cn(
                "flex flex-col",
                tier.mostPopular && "border-primary shadow-lg relative"
              )}
            >
              {tier.mostPopular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
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
                      ${price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{billingCycle === "MONTHLY" ? "mo" : billingCycle === "QUARTERLY" ? "qtr" : "yr"}
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
                  disabled={loadingPlan === tier.id}
                >
                  {loadingPlan === tier.id ? "Processing..." : tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
