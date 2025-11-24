"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

const positions = [
  {
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time"
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time"
  },
  {
    title: "Customer Success Manager",
    department: "Operations",
    location: "New York, NY",
    type: "Full-time"
  }
];

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Join the Team</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're building the financial operating system for the next generation of businesses. Come help us shape the future.
            </p>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Open Positions</h2>
            <div className="grid gap-4">
              {positions.map((position, i) => (
                <div key={i} className="flex items-center justify-between p-6 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-lg">{position.title}</h3>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>{position.department}</span>
                      <span>•</span>
                      <span>{position.location}</span>
                      <span>•</span>
                      <span>{position.type}</span>
                    </div>
                  </div>
                  <Button variant="outline">Apply Now</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
