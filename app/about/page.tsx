"use client"

import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto px-4 md:px-6 py-16">
          <div className="mx-auto max-w-4xl space-y-16">

            {/* Header */}
            <div className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                About Invixy
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Building simple, reliable financial tools for modern businesses.
              </p>
            </div>

            {/* Hero Image */}
            {/* <div className="relative overflow-hidden rounded-3xl border bg-muted">
              <Image
                src="/images/about/about-invixy.jpg"
                alt="Invixy dashboard and team"
                width={1600}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
            </div> */}

            {/* Content */}
            <article
              className="
                prose prose-neutral dark:prose-invert
                max-w-none

                prose-h2:text-2xl
                prose-h2:font-bold
                prose-h2:tracking-tight
                prose-h2:mt-12
                prose-h2:mb-4

                prose-p:text-base
                prose-p:leading-relaxed
                prose-p:text-muted-foreground

                prose-ul:mt-4
                prose-li:my-1
              "
            >
              <section>
                <p>
                  Invixy was founded in 2024 with a clear belief: invoicing and
                  financial operations should not feel complicated or
                  intimidating. We noticed that most businesses were forced to
                  choose between tools that were either too basic to scale or
                  too complex to adopt.
                </p>

                <p>
                  Invixy was built to bridge that gap — a modern, professional
                  invoicing platform that is powerful under the hood, yet
                  intuitive enough to use every day without friction.
                </p>
              </section>

              <section>
                <h2>Who We Serve</h2>
                <p>
                  Today, Invixy supports freelancers, startups, agencies, and
                  growing businesses across industries. Whether you’re sending
                  your first invoice or managing recurring billing for hundreds
                  of clients, Invixy is designed to grow with you.
                </p>

                <p>
                  Our platform is especially built with Indian businesses in
                  mind — supporting GST workflows, exports, compliance-ready
                  records, and integrations that fit local needs.
                </p>
              </section>

              <section>
                <h2>Our Mission</h2>
                <p>
                  Our mission is simple: to remove financial complexity so
                  businesses can focus on what truly matters — building,
                  selling, and growing.
                </p>

                <p>
                  We believe good software should fade into the background and
                  quietly do its job, reliably and securely.
                </p>
              </section>

              <section>
                <h2>Our Values</h2>
                <ul>
                  <li>
                    <strong>Simplicity first</strong> — We design software that
                    feels obvious, not overwhelming.
                  </li>
                  <li>
                    <strong>Customer-driven</strong> — We listen closely and
                    build based on real business needs.
                  </li>
                  <li>
                    <strong>Transparency always</strong> — Clear pricing, honest
                    communication, no hidden surprises.
                  </li>
                  <li>
                    <strong>Security by default</strong> — Financial data
                    deserves strong protection and responsible handling.
                  </li>
                </ul>
              </section>

              <section>
                <h2>Looking Ahead</h2>
                <p>
                  Invixy is continuously evolving. We’re investing in automation,
                  analytics, and deeper integrations to help businesses run
                  smarter and faster — without adding complexity.
                </p>

                <p>
                  We’re proud to be building a product that businesses can rely
                  on, today and tomorrow.
                </p>
              </section>
            </article>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
