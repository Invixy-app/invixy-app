"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: November 24, 2025</p>
          
          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                Invixy ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Name and contact information</li>
                <li>Business details and tax information</li>
                <li>Payment information</li>
                <li>Usage data and preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
