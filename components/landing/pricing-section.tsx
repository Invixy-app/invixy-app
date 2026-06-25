"use client"

import { PricingTable } from "@/components/pricing-table"

export function PricingSection() {
  return (
    <section id="pricing" className=" py-24 sm:py-32 px-4 w-full mx-auto">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">
          Simple, transparent pricing
        </h2>
        {/* <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Choose the plan that&apos;s right for you. All plans include a 14-day free trial.
        </p> */}
        
        <PricingTable mode="landing" />
      </div>
    </section>
  )
}
