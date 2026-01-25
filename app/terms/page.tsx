"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-16">
          <div className="mx-auto max-w-3xl">

            {/* Title */}
            <div className="mb-12 space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                INVIXY — Terms & Conditions
              </h1>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Effective date: [DD/MM/YYYY]</p>
                <p>Last updated: [DD/MM/YYYY]</p>
                <p>
                  Contact:{" "}
                  <a
                    href="mailto:support@invixy.com"
                    className="text-primary hover:underline"
                  >
                    support@invixy.com
                  </a>
                </p>
              </div>
            </div>

            {/* Content */}
            <article
              className="
                max-w-none
                prose prose-neutral dark:prose-invert

                prose-h2:text-2xl
                prose-h2:font-bold
                prose-h2:tracking-tight
                prose-h2:mt-12
                prose-h2:mb-4

                prose-h3:text-lg
                prose-h3:font-semibold
                prose-h3:mt-8
                prose-h3:mb-2

                prose-p:text-base
                prose-p:leading-relaxed
                prose-p:text-muted-foreground

                prose-ul:mt-3
                prose-ul:mb-4
                prose-li:my-1

                prose-strong:text-foreground
              "
            >

              <section>
                <h2>1. Acceptance</h2>
                <p>
                  By using the INVIXY service, you agree to these Terms and to
                  our Privacy Policy. If you do not agree, you must not use the
                  Service.
                </p>
              </section>

              <section>
                <h2>2. Definitions</h2>
                <ul>
                  <li>
                    <strong>Service</strong> — INVIXY web and mobile applications
                    and related services.
                  </li>
                  <li>
                    <strong>User / Customer</strong> — Any person or entity that
                    registers an account.
                  </li>
                  <li>
                    <strong>Invoice Data / Content</strong> — Any data, files,
                    or information uploaded or generated through the Service.
                  </li>
                </ul>
              </section>

              <section>
                <h2>3. Eligibility & Account</h2>
                <ul>
                  <li>You must be at least 18 years old and authorized to enter into a binding contract.</li>
                  <li>You are responsible for safeguarding account credentials.</li>
                  <li>
                    You must notify us immediately of any unauthorized access
                    or use of your account.
                  </li>
                </ul>
              </section>

              <section>
                <h2>4. Use of Service & License</h2>
                <p>
                  INVIXY grants you a limited, non-exclusive,
                  non-transferable license to use the Service in accordance with
                  these Terms.
                </p>
                <p>
                  You retain ownership of your data. You grant INVIXY a limited
                  license to host, copy, transmit, and display your content solely
                  to provide the Service. This license terminates upon account
                  deletion, subject to backup and legal retention obligations.
                </p>
              </section>

              <section>
                <h2>5. User Responsibilities & Prohibited Uses</h2>
                <p>You must not:</p>
                <ul>
                  <li>Use the Service for illegal or fraudulent activities</li>
                  <li>Upload content infringing third-party rights</li>
                  <li>Probe, scan, or test system security</li>
                  <li>Circumvent usage limits or licensing controls</li>
                </ul>
                <p>
                  You are solely responsible for invoice accuracy, GST
                  calculations, filings, and statutory compliance. INVIXY
                  provides tools and exports but does not provide legal or tax
                  advice.
                </p>
              </section>

              <section>
                <h2>6. GST & e-Invoicing Particulars</h2>
                <p>
                  <strong>GST Compliance:</strong> You are responsible for
                  ensuring invoices comply with applicable GST laws, including
                  GSTIN accuracy and tax rates.
                </p>
                <p>
                  <strong>E-Invoicing:</strong> Where e-invoicing is mandatory,
                  INVIXY may offer integrations or exports; however, final
                  compliance and submission responsibility rests with you.
                  Government thresholds and rules may change.
                </p>
              </section>

              <section>
                <h2>7. Payments, Subscriptions & Refunds</h2>
                <ul>
                  <li>Paid plans are billed on a recurring basis unless cancelled.</li>
                  <li>Cancellation stops future billing; past charges are non-refundable unless stated.</li>
                  <li>Free trials may convert to paid plans after trial completion.</li>
                  <li>Applicable taxes (including GST) may be charged.</li>
                </ul>
                <p>
                  Payments may be processed by third-party gateways. PCI-DSS
                  responsibilities apply where card data is handled.
                </p>
              </section>

              <section>
                <h2>8. Data & Backups</h2>
                <p>
                  You are responsible for exporting and backing up your data.
                  While we maintain backups, INVIXY is not liable for data loss
                  caused by user actions or force majeure events.
                </p>
                <p>
                  Certain data may be retained after termination to comply with
                  legal or tax obligations.
                </p>
              </section>

              <section>
                <h2>9. Intellectual Property</h2>
                <p>
                  INVIXY owns all rights to the software, interface, branding,
                  and documentation. You retain ownership of your content.
                </p>
              </section>

              <section>
                <h2>10. Confidentiality</h2>
                <p>
                  Both parties agree to keep confidential any proprietary or
                  non-public information, except where disclosure is required
                  by law.
                </p>
              </section>

              <section>
                <h2>11. Warranties & Disclaimers</h2>
                <p>
                  The Service is provided “as is” and “as available.” INVIXY
                  disclaims all warranties, express or implied, including
                  merchantability or fitness for a particular purpose.
                </p>
              </section>

              <section>
                <h2>12. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, INVIXY’s liability is
                  limited to direct damages up to the amount paid by you in the
                  preceding 12 months. We are not liable for indirect or
                  consequential damages.
                </p>
              </section>

              <section>
                <h2>13. Indemnity</h2>
                <p>
                  You agree to indemnify and hold INVIXY harmless from claims
                  arising from your use of the Service, violation of these
                  Terms, or infringement of third-party rights.
                </p>
              </section>

              <section>
                <h2>14. Termination & Suspension</h2>
                <p>
                  We may suspend or terminate access for violations or
                  non-payment. Upon termination, you must stop using the
                  Service.
                </p>
              </section>

              <section>
                <h2>15. Changes to Service & Terms</h2>
                <p>
                  We may modify the Service or these Terms. Material changes
                  will be communicated via email or in-app notices. Continued
                  use constitutes acceptance.
                </p>
              </section>

              <section>
                <h2>16. Governing Law & Dispute Resolution</h2>
                <p>
                  These Terms are governed by the laws of India. Courts of
                  [City, India] shall have exclusive jurisdiction, unless
                  arbitration is mutually agreed.
                </p>
              </section>

              <section>
                <h2>17. Contact</h2>
                <p>
                  For support or legal inquiries, contact{" "}
                  <a
                    href="mailto:support@invixy.com"
                    className="text-primary hover:underline"
                  >
                    support@invixy.com
                  </a>.
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
