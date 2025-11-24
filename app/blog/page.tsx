"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

const posts = [
  {
    title: "The Future of Invoicing is Automated",
    description: "How AI and automation are changing the way businesses handle finances.",
    date: "November 15, 2025",
    slug: "future-of-invoicing"
  },
  {
    title: "5 Tips for Getting Paid Faster",
    description: "Simple strategies to improve your cash flow and reduce overdue invoices.",
    date: "November 10, 2025",
    slug: "getting-paid-faster"
  },
  {
    title: "Invixy v2.0 Release Notes",
    description: "Everything new in our biggest update yet. Dark mode, API access, and more.",
    date: "November 1, 2025",
    slug: "v2-release-notes"
  }
];

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
            <p className="text-xl text-muted-foreground">
              Latest news, updates, and insights from the Invixy team.
            </p>
          </div>
          
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.slug} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="text-sm text-muted-foreground mb-2">{post.date}</div>
                  <CardTitle className="text-2xl">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {post.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/blog/${post.slug}`} className="text-primary font-medium hover:underline">
                    Read more →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
