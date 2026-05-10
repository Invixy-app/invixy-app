"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  DollarSign,
  PlayCircle,
} from "lucide-react";
import { FAQ as FaqSection } from "@/components/landing/faq";
import { features } from "@/components/landing/features-section";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingTable } from "@/components/pricing-table";

export default function LandingPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground selection:bg-[var(--brand-cobalt)]/30 selection:text-foreground">
      <div className="pointer-events-none absolute left-[8%] top-24 h-72 w-72 rounded-full bg-[var(--brand-cobalt)]/18 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 right-[5%] h-80 w-80 rounded-full bg-[var(--brand-teal)]/10 blur-[130px]" />

      <SiteHeader />

      <main className="flex-1 overflow-hidden">
        <section className="relative pb-20 pt-12 ">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:px-8 lg:grid-cols-2 lg:gap-20 ">
            <div className="relative z-10 text-left">
              <span className="mb-8 inline-block rounded-full border border-border bg-muted/40 px-4 py-2 font-mono text-[10px] font-light uppercase tracking-[0.26em] text-muted-foreground">
                Intelligent Finance Operating Layer
              </span>

              <h1 className="text-[18vw] font-black leading-[0.82] tracking-[-0.035em] text-foreground sm:text-7xl md:text-8xl lg:text-[7.2rem]">
                Get paid{" "}
                <span className="block text-[var(--brand-cyan)]">without friction.</span>
              </h1>

              <p className="mb-10 mt-8 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground md:mb-12 md:text-base">
                Automate your financial document lifecycle. From invoice
                creation to settlement workflows, Invixy removes manual overhead
                and gives your team confident control.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href={isAuthenticated ? "/dashboard" : "/auth/signup"}>
                  <button className="group inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[var(--brand-cobalt)] px-10 py-5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-stone-50 shadow-[0_18px_45px_-20px_rgba(37,99,235,0.7)] transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--brand-indigo)]">
                   {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                {/* <button className="group inline-flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-border bg-card px-10 py-5 font-mono text-xs font-light uppercase tracking-[0.18em] text-foreground transition-all duration-300 hover:border-[var(--brand-cobalt)]/40 hover:bg-muted">
                  <PlayCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Watch Demo
                </button> */}
              </div>

              <div className="mt-12 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-3">
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-[var(--brand-cyan)]/25" />
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-[var(--brand-cobalt)]/45" />
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-[var(--brand-indigo)]/60" />
                </div>
                <span className="font-mono text-xs font-light uppercase tracking-[0.14em]">
                  Trusted by global finance teams
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-[var(--brand-indigo)]/30 blur-[100px]" />

              <div className="relative w-full rounded-[2rem] border border-border bg-card/90 p-3 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:-translate-y-1 dark:shadow-[0_40px_120px_-50px_rgba(0,0,0,0.9)]">
                <div className="aspect-[4/3] rounded-[1.5rem] border border-border bg-background/80 p-6">
                  <div className="mb-10 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                      <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                      <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="h-6 w-32 rounded-md bg-muted" />
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border bg-card p-5">
                        <p className="font-mono text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground">
                          Monthly Billing
                        </p>
                        <p className="mt-3 text-3xl font-black text-foreground">
                          $42,850
                        </p>
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full w-3/4 bg-[var(--brand-cyan)]" />
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-5">
                        <p className="font-mono text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground">
                          Outstanding
                        </p>
                        <p className="mt-3 text-3xl font-black text-foreground">
                          $12,400
                        </p>
                        <p className="mt-3 font-mono text-[10px] font-light uppercase tracking-[0.18em] text-[var(--brand-cyan)]">
                          3 overdue invoices
                        </p>
                      </div>
                    </div>

                    <div className="h-36 rounded-xl border border-border bg-card p-5">
                      <div className="mb-4 flex justify-between">
                        <div className="h-3.5 w-24 rounded bg-muted" />
                        <div className="h-3.5 w-14 rounded bg-muted" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-2 w-full rounded bg-muted" />
                        <div className="h-2 w-full rounded bg-muted" />
                        <div className="h-2 w-4/5 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-7 left-3 z-20 hidden items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xl sm:flex md:-left-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-cobalt)]">
                  <DollarSign className="h-5 w-5 text-stone-50" />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-light uppercase tracking-[0.18em] text-muted-foreground">
                    New Payment
                  </p>
                  <p className="text-sm font-black text-foreground">
                    $1,200.00 Received
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-20 text-foreground md:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center ">
            <h2 className="text-5xl font-black tracking-tight md:text-7xl">
              Designed for operational excellence.
            </h2>
            <p className="mx-auto mt-7 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
              We have broken down financial management into a seamless,
              high-velocity workflow your team can scale with confidence.
            </p>
          </div>
        </section>

        <section id="features" className="relative overflow-hidden bg-foreground py-24 text-background dark:bg-zinc-950 dark:text-zinc-50 md:py-28">
          <div className="absolute right-0 top-0 h-[420px] w-[420px] translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-indigo)]/25 blur-[130px]" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ">
            <div className="mb-16 grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
              <div>
                <h2 className="text-4xl font-black leading-[0.95] md:text-7xl">
                  Comprehensive power for modern finance.
                </h2>
                <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-zinc-400 md:text-base">
                  Stop stitching tools together. Invixy brings billing,
                  compliance, and collection operations into one premium command
                  center.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      className={`rounded-3xl border border-zinc-800 bg-zinc-900 p-8 transition-colors hover:bg-zinc-800 ${index % 2 === 1 ? "sm:translate-y-10" : ""}`}
                    >
                      <Icon className={`mb-4 h-8 w-8 ${feature.iconColor}`} />
                      <h4 className="text-xl font-extrabold">{feature.title}</h4>
                      <p className="mt-3 font-mono text-xs leading-relaxed text-zinc-400">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-muted/30 py-20 text-foreground md:py-24">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 ">
            <div className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
              <h2 className="text-4xl font-black tracking-tight sm:text-6xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-5 font-mono text-sm text-muted-foreground md:text-base">
                Start free, scale with confidence, and keep full control over
                your margins.
              </p>
            </div>
            <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card p-3 shadow-[0_30px_90px_-45px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_90px_-45px_rgba(0,0,0,0.75)]">
              <PricingTable mode="landing" />
            </div>
          </div>
        </section>

        <section className="bg-zinc-950">
          <FaqSection />
        </section>

        <section className="bg-zinc-950 py-20 dark:bg-zinc-950 md:py-24">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 ">
            <div className="relative overflow-hidden rounded-3xl border border-stone-200/10 bg-[var(--brand-cobalt)] p-10 text-center text-stone-50 md:p-16 lg:p-20">
              <div className="relative z-10 mx-auto max-w-3xl space-y-6 md:space-y-8">
                <h2 className="text-4xl font-black tracking-tight md:text-6xl">
                  Ready to transform your invoicing?
                </h2>
                <p className="mx-auto max-w-2xl font-mono text-sm uppercase tracking-[0.12em] text-stone-100/85 md:text-base">
                  Join thousands of businesses that trust Invixy for modern
                  financial operations.
                </p>
                <Link
                  href={isAuthenticated ? "/dashboard" : "/auth/signup"}
                  className="inline-block"
                >
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 border border-stone-200/20 bg-stone-50 px-8 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-zinc-950 hover:bg-white"
                  >
                    Get Started Now
                  </Button>
                </Link>
              </div>

              <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full border border-stone-100/20" />
              <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full border border-stone-100/20" />
              <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
