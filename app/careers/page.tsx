"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-16">
          <div className="mx-auto max-w-3xl space-y-12">

            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Careers at Invixy
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Interested in working with us? Share your details and we’ll
                reach out when a suitable opportunity opens up.
              </p>
            </div>

            {/* Form */}
            <div className="rounded-3xl border bg-card p-8 md:p-10 shadow-sm">
              <form className="space-y-6">

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role you’re interested in
                  </Label>
                  <Input
                    id="role"
                    placeholder="e.g. Frontend Engineer, Product, Operations"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience">
                    Experience (optional)
                  </Label>
                  <Input
                    id="experience"
                    placeholder="e.g. 3 years in frontend development"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Tell us a bit about yourself
                  </Label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Briefly describe your background, interests, or why you'd like to work with Invixy."
                  />
                </div>

                {/* CTA */}
                <Button className="w-full h-12 rounded-full text-base">
                  Submit Inquiry
                </Button>

                {/* Note */}
                <p className="text-sm text-muted-foreground text-center">
                  This is not a job application. We’ll contact you if there’s a
                  relevant opening.
                </p>

              </form>
            </div>

          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
