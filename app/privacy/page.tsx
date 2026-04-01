"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function PrivacyPolicyPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground selection:bg-[var(--brand-cobalt)]/30 selection:text-foreground">
      {/* Background Blurs */}
      <div className="pointer-events-none absolute left-[8%] top-24 h-72 w-72 rounded-full bg-[var(--brand-cobalt)]/18 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 right-[5%] h-80 w-80 rounded-full bg-[var(--brand-teal)]/10 blur-[130px]" />

      <SiteHeader />

      <main className="flex-1 overflow-hidden">
        {/* Header Section */}
        <section className="relative pb-10 pt-16 md:pt-24">
          <div className="mx-auto max-w-4xl px-8 text-center">
            <span className="mb-6 inline-block rounded-full border border-border bg-muted/40 px-4 py-2 font-mono text-[10px] font-light uppercase tracking-[0.26em] text-muted-foreground">
              Legal
            </span>
            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Privacy Policy
            </h1>
            <div className="mt-8 text-sm font-mono text-muted-foreground space-y-2 flex flex-col items-center">
              <p>Effective date: [DD/MM/YYYY]</p>
              <p>Last updated: [DD/MM/YYYY]</p>
              <p>
                Contact:{" "}
                <a
                  href="mailto:support@invixy.com"
                  className="text-[var(--brand-cobalt)] hover:underline"
                >
                  support@invixy.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="relative pb-24 md:pb-32 px-4 md:px-8">
          <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-border bg-card p-8 md:p-14 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] relative z-10">
            <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-a:text-[var(--brand-cobalt)] prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground space-y-8">

            {/* 1. Introduction */}
            <section>
              <h2>1. Introduction & Scope</h2>
              <p>
                INVIXY (“we”, “us”, “our”) provides an invoice management platform
                and related services. This Privacy Policy explains how we
                collect, use, disclose, store, and protect personal data of
                users, including customers, their employees or clients, and
                website visitors.
              </p>
              <p>
                This policy applies to personal data processed in India and
                globally in connection with our services and is aligned with the
                Digital Personal Data Protection Act, 2023 (DPDP Act) and other
                applicable laws.
              </p>
            </section>

            {/* 2. Definitions */}
            <section>
              <h2>2. Definitions</h2>
              <ul>
                <li>
                  <strong>Personal Data</strong> — Information that identifies or
                  can reasonably identify an individual (name, email, phone,
                  IP address, etc.).
                </li>
                <li>
                  <strong>Sensitive Personal Data</strong> — Financial,
                  authentication, or other data classified as sensitive under
                  applicable law.
                </li>
                <li>
                  <strong>Processing</strong> — Any operation performed on
                  personal data, including collection, storage, use, disclosure,
                  or deletion.
                </li>
              </ul>
            </section>

            {/* 3. What We Collect */}
            <section>
              <h2>3. What We Collect</h2>

              <h3>A. Data You Submit</h3>
              <ul>
                <li>Account information (name, email, phone, company name)</li>
                <li>Billing address and business details</li>
                <li>GSTIN, PAN (if provided for billing or compliance)</li>
                <li>Bank details for payouts (if applicable)</li>
                <li>Customer or client data entered into invoices</li>
                <li>Uploaded documents (invoices, PDFs, contracts)</li>
              </ul>

              <h3>B. Payment Data</h3>
              <p>
                INVIXY does not store raw card numbers by default. Payments are
                processed using PCI-DSS-compliant third-party payment gateways.
                If a feature requires card storage, applicable PCI compliance
                standards will apply.
              </p>

              <h3>C. Automatically Collected Data</h3>
              <ul>
                <li>IP address and device/browser information</li>
                <li>Usage logs, timestamps, and analytics data</li>
              </ul>

              <h3>D. Cookies & Tracking</h3>
              <p>
                We use session cookies, functional cookies, and analytics cookies
                to operate and improve our services. You can manage cookies
                through your browser settings.
              </p>
            </section>

            {/* 4. Purpose */}
            <section>
              <h2>4. Purpose & Lawful Basis</h2>
              <p>We process personal data to:</p>
              <ul>
                <li>Provide and maintain the INVIXY platform</li>
                <li>Process billing and payments</li>
                <li>Provide customer support and communications</li>
                <li>Detect fraud, abuse, and security incidents</li>
                <li>Improve product functionality and analytics</li>
                <li>Comply with legal and regulatory obligations</li>
              </ul>
              <p>
                Processing is based on contract performance, legitimate
                interests, consent (where required), and legal obligations.
              </p>
            </section>

            {/* 5. Sharing */}
            <section>
              <h2>5. Sharing & Third Parties</h2>
              <p>
                We share personal data only with trusted third parties,
                including:
              </p>
              <ul>
                <li>Hosting, analytics, and email service providers</li>
                <li>Payment gateways and banking partners</li>
                <li>Regulators or law enforcement when legally required</li>
              </ul>
              <p>
                All third parties are contractually required to protect data and
                use it only for permitted purposes.
              </p>
            </section>

            {/* 6. Cross-Border */}
            <section>
              <h2>6. Cross-Border Transfers</h2>
              <p>
                If personal data is transferred outside India (for example,
                using global cloud providers), such transfers will comply with
                applicable laws and include appropriate safeguards.
              </p>
            </section>

            {/* 7. Retention */}
            <section>
              <h2>7. Data Retention</h2>
              <ul>
                <li>Account data: retained while the account is active</li>
                <li>
                  Invoice and tax records: retained as required by Indian tax
                  and GST laws
                </li>
                <li>
                  Logs and analytics: retained in aggregated or anonymized form
                </li>
              </ul>
            </section>

            {/* 8. Security */}
            <section>
              <h2>8. Security Measures</h2>
              <ul>
                <li>Encryption in transit (TLS) and at rest where applicable</li>
                <li>Role-based access controls and logging</li>
                <li>Regular security reviews and monitoring</li>
                <li>Use of PCI-compliant payment processors</li>
              </ul>
            </section>

            {/* 9. Breach */}
            <section>
              <h2>9. Data Breach & Notification</h2>
              <p>
                In the event of a personal data breach, we will take reasonable
                steps to contain and remediate the incident and notify affected
                users and authorities as required by law.
              </p>
            </section>

            {/* 10. Rights */}
            <section>
              <h2>10. Your Rights & Choices</h2>
              <ul>
                <li>Access and correction of personal data</li>
                <li>Data export and portability</li>
                <li>Account deletion (subject to legal retention)</li>
                <li>Withdrawal of consent where applicable</li>
              </ul>
              <p>
                Requests can be made by contacting our Data Protection or
                Grievance Officer.
              </p>
            </section>

            {/* 11. Children */}
            <section>
              <h2>11. Children</h2>
              <p>
                INVIXY services are not intended for individuals under 18. We do
                not knowingly collect personal data from children.
              </p>
            </section>

            {/* 12. Changes */}
            <section>
              <h2>12. Changes to this Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Material
                changes will be communicated via email or in-app notifications.
              </p>
            </section>

            {/* 13. Contact */}
            <section>
              <h2>13. Contact & Grievance Officer</h2>
              <p><strong>Data Protection / Grievance Officer</strong></p>
              <p>[Name]</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:dpo@invixy.com"
                  className="text-primary hover:underline"
                >
                  dpo@invixy.com
                </a>
              </p>
              <p>Phone: +91 XXXXXXXXXX</p>
              <p>Address: [Company Address]</p>
            </section>

            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
