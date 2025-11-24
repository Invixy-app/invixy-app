"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: November 24, 2025</p>
          
          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Invixy, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on Invixy's website for personal, non-commercial transitory viewing only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
              <p>
                The materials on Invixy's website are provided on an 'as is' basis. Invixy makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
              <p>
                In no event shall Invixy or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Invixy's website.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
