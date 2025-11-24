"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold tracking-tight">About Invixy</h1>
          <p className="text-xl text-muted-foreground">
            We are on a mission to simplify financial operations for businesses of all sizes.
          </p>
          
          <div className="prose dark:prose-invert max-w-none">
            <p>
              Founded in 2024, Invixy was born from a simple observation: invoicing software was either too simple to be useful or too complex to be usable. We set out to build the middle ground - a powerful, professional invoicing platform that anyone can use.
            </p>
            <p>
              Today, we serve thousands of freelancers, agencies, and small businesses across the globe. Our team is distributed, diverse, and dedicated to building the best financial tools on the web.
            </p>
            
            <h2>Our Values</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Simplicity first:</strong> We believe software should be intuitive and easy to use.</li>
              <li><strong>Customer obsessed:</strong> We build what our customers need, not what we think they want.</li>
              <li><strong>Transparent always:</strong> No hidden fees, no dark patterns, just honest business.</li>
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
