"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, BarChart3, Shield, Zap, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              IV
            </div>
            <span>Invixy</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

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
                <Link href="/auth/signup">
                  <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                    Start for free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
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

        {/* Features Grid */}
        <section id="features" className="py-24 bg-muted/30 border-y">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Everything you need to run your business
              </h2>
              <p className="text-muted-foreground text-lg">
                Powerful features packaged in a simple, intuitive interface.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description:
                    "Built on modern infrastructure for instant page loads and real-time updates.",
                },
                {
                  icon: Shield,
                  title: "Bank-Grade Security",
                  description: "Your data is encrypted at rest and in transit. We take security seriously.",
                },
                {
                  icon: Globe,
                  title: "Global Ready",
                  description:
                    "Support for multiple currencies, languages, and tax regulations worldwide.",
                },
                {
                  icon: CheckCircle2,
                  title: "Automated Workflows",
                  description: "Set up recurring invoices and payment reminders to save time.",
                },
                {
                  icon: BarChart3,
                  title: "Advanced Analytics",
                  description:
                    "Gain insights into your revenue, expenses, and cash flow with detailed reports.",
                },
                {
                  icon: FileText, // Using FileText instead of Users for variety, though Users was imported
                  title: "Custom Templates",
                  description: "Create professional invoices that match your brand identity perfectly.",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-card p-8 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

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

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs">
                  IV
                </div>
                <span>Invixy</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Modern invoicing for forward-thinking businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Invixy Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper component for features
function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
