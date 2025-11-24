"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TrustedBy } from "@/components/landing/trusted-by";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LandingPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-muted/50 text-muted-foreground backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                v2.0 is now live
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
                Invoicing for the <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  modern business
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Streamline your financial operations with a platform designed for speed, accuracy, and growth.
                Create, send, and track invoices in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                      Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signup">
                    <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                      Start for free <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href="#demo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base w-full sm:w-auto"
                  >
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image / Dashboard Preview */}
            <div className="mt-20 relative mx-auto max-w-6xl">
              <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
                <div className="h-12 bg-muted/30 border-b flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30"></div>
                  </div>
                  <div className="mx-auto w-1/3 h-6 bg-muted/50 rounded-md text-[10px] flex items-center justify-center text-muted-foreground font-mono">
                    invixy.app/dashboard
                  </div>
                </div>
                <div className="aspect-[16/9] bg-muted/10 p-8 flex items-center justify-center text-muted-foreground">
                  {/* Placeholder for actual dashboard screenshot */}
                  <div className="text-center space-y-2">
                    <BarChart3 className="h-16 w-16 mx-auto opacity-20" />
                    <p className="text-sm font-medium">Dashboard Preview</p>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <TrustedBy />

        {/* Features Section */}
        <FeaturesSection />

        {/* Testimonials Section */}
        <Testimonials />

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Section */}
        <FAQ />

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="bg-primary text-primary-foreground rounded-3xl p-12 md:p-24 text-center relative overflow-hidden">
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Ready to transform your invoicing?
                </h2>
                <p className="text-primary-foreground/80 text-xl max-w-2xl mx-auto">
                  Join thousands of businesses that trust Invixy for their financial operations.
                </p>
                <Link href="/auth/signup" className="inline-block">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 px-8 text-lg font-semibold text-primary"
                  >
                    Get Started Now
                  </Button>
                </Link>
              </div>

              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg
                  className="h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

