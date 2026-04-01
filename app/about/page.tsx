"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShieldCheck, HeartPulse, Zap, Search, Linkedin } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const values = [
    {
      title: "Simplicity first",
      description: "We design software that feels obvious, not overwhelming.",
      icon: Zap,
    },
    {
      title: "Customer-driven",
      description: "We listen closely and build based on real business needs.",
      icon: HeartPulse,
    },
    {
      title: "Transparency always",
      description: "Clear pricing, honest communication, no hidden surprises.",
      icon: Search,
    },
    {
      title: "Security by default",
      description: "Financial data deserves strong protection and responsible handling.",
      icon: ShieldCheck,
    },
  ];

  const founders = [
    {
      name: "Jaydeep Manchanda",
      role: "Co-Founder",
      linkedin: "https://www.linkedin.com/in/jaydeepmanchanda/",
      initials: "JM",
    },
    {
      name: "Lovish Sharma",
      role: "Co-Founder",
      linkedin: "https://www.linkedin.com/in/lovish1sharma/",
      initials: "LS",
    }
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground selection:bg-[var(--brand-cobalt)]/30 selection:text-foreground">
      {/* Background Blurs */}
      <div className="pointer-events-none absolute left-[8%] top-24 h-72 w-72 rounded-full bg-[var(--brand-cobalt)]/18 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 right-[5%] h-80 w-80 rounded-full bg-[var(--brand-teal)]/10 blur-[130px]" />

      <SiteHeader />

      <main className="flex-1 overflow-hidden">
        {/* Hero Section */}
        <section className="relative pb-16 pt-20 md:pt-28">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <span className="mb-8 inline-block rounded-full border border-border bg-muted/40 px-4 py-2 font-mono text-[10px] font-light uppercase tracking-[0.26em] text-muted-foreground">
              Our Vision
            </span>
            <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.035em] text-foreground sm:text-6xl md:text-7xl lg:text-[6rem]">
              Building the <span className="text-[var(--brand-cobalt)]">financial OS</span><br className="hidden md:block"/> for modern business.
            </h1>
            <p className="mx-auto mt-8 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
              Invixy was founded with a clear belief: invoicing and financial operations should not feel complicated or intimidating. We are building the premium command center for your business.
            </p>
          </div>
        </section>

        {/* The Story / Mission */}
        <section className="relative overflow-hidden bg-foreground py-24 text-background dark:bg-zinc-950 dark:text-zinc-50 md:py-28 mt-12 shrink-0">
          <div className="absolute right-0 top-0 h-[420px] w-[420px] translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-indigo)]/25 blur-[130px]" />
          <div className="relative z-10 mx-auto max-w-7xl px-8 grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="text-4xl font-black leading-[0.95] md:text-5xl lg:text-6xl">
                Bridge the <br className="hidden md:block"/> software gap.
              </h2>
            </div>
            <div className="space-y-6 text-zinc-400 font-mono text-sm leading-relaxed md:text-base lg:text-lg">
              <p>
                We noticed that most businesses were forced to choose between tools that were either too basic to scale or too complex to adopt. 
              </p>
              <p>
                Invixy was built to bridge that gap — a modern, professional invoicing platform that is powerful under the hood, yet intuitive enough to use every day without friction.
              </p>
              <p>
                Whether you&apos;re sending your first invoice or managing recurring billing for hundreds of clients, Invixy is designed to grow with you.
              </p>
            </div>
          </div>
        </section>

        {/* Meet the Founders */}
        <section className="relative py-20 md:py-28 bg-muted/30">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-14 text-center md:mb-20">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                Meet the Founders
              </h2>
              <p className="mt-5 font-mono text-sm text-muted-foreground md:text-base">
                The team building the future of financial operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {founders.map((founder) => (
                <div key={founder.name} className="relative group rounded-3xl border border-border bg-card p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_15px_45px_-10px_rgba(0,0,0,0.1)] hover:border-primary/50 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--brand-cobalt)] to-[var(--brand-cyan)] p-[2px] mb-6 shadow-md">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-black text-2xl text-foreground">
                      {founder.initials}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">{founder.name}</h3>
                  <p className="text-[var(--brand-cobalt)] font-mono text-sm font-semibold uppercase tracking-widest mt-2 mb-6">{founder.role}</p>
                  
                  <Link href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 justify-center w-full rounded-xl bg-muted/50 px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--brand-cobalt)]/10 hover:text-[var(--brand-cobalt)]">
                    <Linkedin className="h-5 w-5" />
                    <span>Connect on LinkedIn</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Bento Grid */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-14 text-center md:mb-16">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                Our Core Values
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {values.map((val) => {
                const Icon = val.icon;
                return (
                  <div
                    key={val.title}
                    className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-cobalt)]/10 text-[var(--brand-cobalt)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-extrabold">{val.title}</h4>
                    <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
                      {val.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 py-20 dark:bg-zinc-950 md:py-24">
          <div className="mx-auto px-8 max-w-7xl">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-stone-200/10 bg-[var(--brand-cobalt)] p-10 text-center text-stone-50 md:p-16 lg:p-20 shadow-2xl">
              <div className="relative z-10 mx-auto max-w-3xl space-y-6 md:space-y-8">
                <h2 className="text-4xl font-black tracking-tight md:text-6xl">
                  Looking Ahead
                </h2>
                <p className="mx-auto max-w-2xl font-mono text-sm uppercase tracking-[0.12em] text-stone-100/85 md:text-base">
                  Invixy is continuously evolving. We are investing in automation, analytics, and deeper integrations to help businesses run smarter and faster.
                </p>
                <Link
                  href="/auth/signup"
                  className="inline-block mt-4"
                >
                  <button
                    className="h-14 rounded-xl border border-stone-200/20 bg-stone-50 px-8 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-zinc-950 shadow-xl transition-transform hover:-translate-y-1 hover:bg-white"
                  >
                    Join Us Today
                  </button>
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
