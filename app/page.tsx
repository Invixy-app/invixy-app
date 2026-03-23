"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  Code,
  DollarSign,
  Globe,
  Landmark,
  PlayCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { FeaturesSection } from "@/components/landing/features-section";
import { TrustedBy } from "@/components/landing/trusted-by";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ as FaqSection } from "@/components/landing/faq";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingTable } from "@/components/pricing-table"; // Assuming this is exported correctly

export default function LandingPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <SiteHeader />

      <main className="flex-1 overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-12 pb-12 md:pt-12 md:pb-12 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10 text-left">
              <span className="bg-[#003ec7]/10 text-[#003ec7] text-xs tracking-widest font-black px-4 py-1.5 rounded-full uppercase mb-8 inline-block">
                The New Era of Financial Management
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#191c1e] mb-8 leading-[1.05]">
                Get paid faster, with{" "}
                <span className="text-[#003ec7] italic">zero effort.</span>
              </h1>
              <p className="text-xl text-[#434656] max-w-xl mb-12 leading-relaxed">
                Automate your financial document lifecycle. From high-fidelity
                time tracking to professional ledger-style invoicing, Invixy
                handles the complexity while you scale.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                <button className="cursor-pointer bg-gradient-to-br from-[#003ec7] to-[#0052ff] text-white text-lg font-bold px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
                  Create Free Account
                </button>
                </Link>
                <button className="cursor-pointer bg-white border border-slate-200 text-[#191c1e] text-lg font-bold px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group">
                  <PlayCircle className="group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>
              <div className="mt-12 flex items-center gap-4 text-sm text-[#434656] font-medium">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white"></div>
                </div>
                <span>Trusted by multiple professionals globally</span>
              </div>
            </div>

            {/* High-Fidelity Mockup */}
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#003ec7]/20 rounded-full blur-[120px] -z-10"></div>
              <div className="bg-white rounded-3xl p-3 shadow-2xl border border-white/50 relative">
                <div className="bg-[#f2f4f6] rounded-2xl overflow-hidden aspect-[4/3] border border-[#c3c5d9]/20 p-6">
                  <div className="flex justify-between items-center mb-10">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Monthly Billing
                        </p>
                        <p className="text-2xl font-black">$42,850.00</p>
                        <div className="w-full h-1 bg-[#003ec7]/20 mt-4 rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-[#003ec7]"></div>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Outstanding
                        </p>
                        <p className="text-2xl font-black">$12,400.00</p>
                        <p className="text-[10px] font-bold text-red-500 mt-2">
                          3 OVERDUE
                        </p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-40">
                      <div className="flex justify-between mb-4">
                        <div className="h-4 w-24 bg-slate-100 rounded"></div>
                        <div className="h-4 w-12 bg-slate-100 rounded"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-2 w-full bg-slate-50 rounded"></div>
                        <div className="h-2 w-full bg-slate-50 rounded"></div>
                        <div className="h-2 w-4/5 bg-slate-50 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Float Card */}
              <div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-[bounce_2s_infinite]">
                <div className="w-10 h-10 rounded-full bg-[#007633] flex items-center justify-center">
                  <DollarSign className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">
                    NEW PAYMENT
                  </p>
                  <p className="text-sm font-black">$1,200.00 Received</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section - More minimalist */}
        {/* <TrustedBy /> */}
        {/* Detailed How it Works */}
        <section className="py-20 bg-[#f7f9fb]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center ">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                Designed for operational excellence.
              </h2>
              <p className="text-[#434656] text-xl max-w-2xl mx-auto leading-relaxed">
                We`ve broken down financial management into a seamless,
                high-velocity workflow.
              </p>
            </div>
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="group">
                <div className="w-16 h-16 bg-[#003ec7]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#003ec7] group-hover:text-white text-[#191c1e] transition-all duration-300">
                  <Wrench className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  1. Effortless Ingestion
                </h3>
                <p className="text-[#434656] leading-relaxed mb-6">
                  Connect your bank accounts, calendars, and time trackers. Our
                  AI engine categorizes every billable action with ledger-grade
                  precision.
                </p>
                <ul className="space-y-2 text-sm font-medium text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="text-[#003ec7] w-5 h-5" /> Bank sync
                    (Plaid)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-[#003ec7] w-5 h-5" /> Automatic time
                    logging
                  </li>
                </ul>
              </div>
              <div className="group">
                <div className="w-16 h-16 bg-[#003ec7]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#003ec7] group-hover:text-white text-[#191c1e] transition-all duration-300">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  2. Intelligent Synthesis
                </h3>
                <p className="text-[#434656] leading-relaxed mb-6">
                  Invixy aggregates data points into beautiful,
                  editorial-quality invoices. No more manual formatting or
                  cross-referencing spreadsheets.
                </p>
                <ul className="space-y-2 text-sm font-medium text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="text-[#003ec7] w-5 h-5" /> Dynamic ledger
                    styling
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-[#003ec7] w-5 h-5" /> Multi-currency
                    conversion
                  </li>
                </ul>
              </div>
              <div className="group">
                <div className="w-16 h-16 bg-[#003ec7]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#003ec7] group-hover:text-white text-[#191c1e] transition-all duration-300">
                  <Landmark className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  3. Instant Settlement
                </h3>
                <p className="text-[#434656] leading-relaxed mb-6">
                  Clients pay via white-labeled portals. Funds are instantly
                  reconciled and distributed across your tax and savings
                  buckets.
                </p>
                <ul className="space-y-2 text-sm font-medium text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="text-[#003ec7] w-5 h-5" /> 1-click client
                    payments
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="text-[#003ec7] w-5 h-5" /> Automated tax
                    withholding
                  </li>
                </ul>
              </div>
            </div> */}
          </div>
        </section>
        {/* Features Grid Section */}
        <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#003ec7]/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center mb-20">
              <div>
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                  Comprehensive power for modern finance.
                </h2>
                <p className="text-slate-400 text-xl leading-relaxed">
                  Stop piecing together tools. Invixy is the singular platform
                  for global billing, compliance, and cash flow management.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
                  <Globe className="text-[#0052ff] mb-4 w-8 h-8" />
                  <h4 className="text-lg font-bold mb-2">Global Payments</h4>
                  <p className="text-slate-400 text-sm">
                    Accept 135+ currencies with local settlement options.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
                  <Bell className="text-[#0052ff] mb-4 w-8 h-8" />
                  <h4 className="text-lg font-bold mb-2">Auto Reminders</h4>
                  <p className="text-slate-400 text-sm">
                    Polite, automated follow-ups for overdue payments.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
                  <Receipt className="text-[#0052ff] mb-4 w-8 h-8" />
                  <h4 className="text-lg font-bold mb-2">Tax Readiness</h4>
                  <p className="text-slate-400 text-sm">
                    Real-time VAT/Sales Tax calculation and reporting.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
                  <Code className="text-[#0052ff] mb-4 w-8 h-8" />
                  <h4 className="text-lg font-bold mb-2">Deep API</h4>
                  <li className="text-slate-400 text-sm list-none">
                    Integrate with your custom CRM or ERP stack.
                  </li>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Start for free, scale as you grow. No hidden fees.
              </p>
            </div>
            <div className="max-w-5xl mx-auto">
              <PricingTable mode="landing" />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {/* <Testimonials /> */}

        {/* FAQ */}
        <FaqSection />

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="bg-primary text-primary-foreground rounded-3xl p-12 md:p-24 text-center relative overflow-hidden">
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Ready to transform your invoicing?
                </h2>
                <p className="text-primary-foreground/80 text-xl max-w-2xl mx-auto">
                  Join thousands of businesses that trust Invixy for their
                  financial operations.
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
