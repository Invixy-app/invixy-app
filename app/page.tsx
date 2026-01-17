"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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
        <section className="relative pt-10 pb-20 md:pt-18 md:pb-32 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 rounded-[100%] blur-3xl -z-10 opacity-50" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
              <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur-xl shadow-sm animate-fade-in-up">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                <span>v2.0 is now live</span>
                <span className="mx-2 text-muted-foreground/30">|</span>
                <span className="text-primary hover:underline cursor-pointer">See what&apos;s new &rarr;</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.1] animate-fade-in-up delay-100">
                Invoicing for the <br />
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-primary">
                    modern business
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                Streamline your financial operations with a platform designed for speed, accuracy, and growth. 
                Create, send, and track invoices in seconds, not hours.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-8 animate-fade-in-up delay-300">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all w-full sm:w-auto">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signup">
                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all w-full sm:w-auto">
                      Start for free <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50 w-full sm:w-auto hover:bg-muted/50"
                  >
                    How it works
                  </Button>
                </Link>
              </div>

              <div className="pt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up delay-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Hero Image / Dashboard Preview */}
            <div className="mt-20 md:mt-32 relative mx-auto max-w-7xl animate-fade-in-up delay-500 perspective-1000">
              <div className="relative rounded-xl border bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden transform transition-transform hover:scale-[1.01] duration-700">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                
                {/* Window Controls */}
                <div className="h-12 bg-muted/80 border-b flex items-center px-4 gap-2 backdrop-blur-md sticky top-0 z-20">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30"></div>
                  </div>
                  <div className="mx-auto bg-background/50 border px-3 py-1 rounded-md text-[10px] flex items-center justify-center text-muted-foreground font-mono shadow-inner">
                    invixy.app/dashboard
                  </div>
                </div>

                {/* Dashboard Content Mockup */}
                <div className="aspect-[16/9] md:aspect-[21/9] bg-muted/10 p-4 md:p-8 flex items-center justify-center text-muted-foreground relative group">
                  <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                  
                  {/* Abstract Dashboard Representation */}
                  <div className="w-full h-full grid grid-cols-12 gap-4 md:gap-6 relative z-10">
                    {/* Sidebar */}
                    <div className="hidden md:block col-span-2 h-full rounded-lg border bg-card/80 shadow-sm p-4 space-y-4">
                      <div className="h-8 w-24 bg-primary/20 rounded animate-pulse" />
                      <div className="space-y-2 pt-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                           <div key={i} className="h-6 w-full bg-muted/50 rounded" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="col-span-12 md:col-span-10 h-full flex flex-col gap-4 md:gap-6">
                      {/* Top Bar */}
                      <div className="h-12 w-full rounded-lg border bg-card/80 shadow-sm flex items-center justify-between px-4">
                        <div className="h-6 w-32 bg-muted/50 rounded" />
                        <div className="h-8 w-8 rounded-full bg-muted/50" />
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div key={`stat-card-${i}`} className="h-24 rounded-lg border bg-card/80 shadow-sm p-4 relative overflow-hidden group/card">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000" />
                            <div className="h-4 w-20 bg-muted/50 rounded mb-2" />
                            <div className="h-8 w-12 bg-primary/20 rounded" />
                          </div>
                        ))}
                      </div>
                      
                      {/* Chart Area */}
                      <div className="flex-1 rounded-lg border bg-card/80 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <BarChart3 className="h-24 w-24" />
                        </div>
                        <div className="h-6 w-48 bg-muted/50 rounded mb-8" />
                        <div className="flex items-end justify-between h-32 gap-2 px-4">
                          {[30, 45, 25, 60, 75, 50, 80, 55, 70, 40].map((h, i) => (
                            <div key={`chart-bar-${i}`} style={{ height: `${h}%` }} className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors cursor-crosshair" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements behind dashboard */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
            </div>
          </div>
        </section>

        {/* Trusted By Section - More minimalist */}
        <TrustedBy />

        {/* Value Proposition Grid (Bento Style) */}
        <section id="features" className="py-24 bg-background relative">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
                        Everything you need to run your business
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Stop juggling multiple tools. Invixy brings all your financial operations into one intuitive platform.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Card 1 */}
                    <div className="col-span-1 md:col-span-2 rounded-3xl border bg-card p-8 md:p-12 relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-48 h-48 -mr-16 -mt-16" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4">Lightning Fast Invoicing</h3>
                            <p className="text-muted-foreground text-lg max-w-md">
                                Generate professional invoices in seconds. Save templates, auto-fill customer details, and send with a single click.
                            </p>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="col-span-1 rounded-3xl border bg-card p-8 md:p-12 relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="relative z-10">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Bank-Grade Security</h3>
                            <p className="text-muted-foreground">
                                Your data is encrypted and secure. SOC2 compliant and audit-ready.
                            </p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="col-span-1 rounded-3xl border bg-card p-8 md:p-12 relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="relative z-10">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
                            <p className="text-muted-foreground">
                                Track cash flow, revenue, and expenses in real-time with beautiful charts.
                            </p>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="col-span-1 md:col-span-2 rounded-3xl border bg-card p-8 md:p-12 relative overflow-hidden group hover:border-primary/50 transition-colors">
                         <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-32 h-32 bg-primary rounded-full blur-3xl opacity-50" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4">Automated Workflows</h3>
                            <p className="text-muted-foreground text-lg max-w-md">
                                Set up recurring invoices, payment reminders, and late fees. Let Invixy handle the chasing so you can focus on working.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Detailed Features (Scroll Animation) */}
        <FeaturesSection />

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
        <Testimonials />

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

