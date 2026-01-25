import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PricingTable } from "@/components/pricing-table"

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <main className="flex-1 container py-10 px-4 w-full mx-auto">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-2 text-center">
          <h1 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">
            Simple, transparent pricing
          </h1>
          {/* <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Choose the plan that&apos;s right for you. All plans include a 14-day free trial.
          </p> */}
          <div className="w-full mt-6">
            <PricingTable mode="landing" />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
