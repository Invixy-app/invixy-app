"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

const posts = [
  {
    title: "The Future of Invoicing is Automated",
    description: "How AI and automation are changing the way businesses handle finances.",
    date: "November 15, 2026",
    slug: "future-of-invoicing",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
  },
  {
    title: "5 Tips for Getting Paid Faster",
    description: "Simple strategies to improve your cash flow and reduce overdue invoices.",
    date: "November 10, 2025",
    slug: "getting-paid-faster",
    image: "https://images.unsplash.com/photo-1554224155-984bb41e1d08?auto=format&fit=crop&q=80&w=2672"
  },
  {
    title: "Invixy v2.0 Release Notes",
    description: "Everything new in our biggest update yet. Dark mode, API access, and more.",
    date: "November 1, 2025",
    slug: "v2-release-notes",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2670"
  }
];

export default function BlogPage() {
  return (
   <div className="flex flex-col min-h-screen bg-background text-foreground">
  <SiteHeader />

  <main className="flex-1 container mx-auto px-4 md:px-6 py-16">
    <div className="max-w-6xl mx-auto space-y-20">

      {/* Page Header */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Invixy Blog
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Product updates, industry insights, and stories from the Invixy team.
        </p>
      </div>

      {/* Featured Post */}
      {posts[0] && (
        <Link
          href={`/blog/${posts[0].slug}`}
          className="group block rounded-3xl overflow-hidden border bg-card hover:shadow-xl transition-all"
        >
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={posts[0].image}
              alt={posts[0].title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>

          <div className="p-8 md:p-10 space-y-4">
            <div className="text-sm text-muted-foreground">
              {posts[0].date}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight group-hover:text-primary transition-colors">
              {posts[0].title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {posts[0].description}
            </p>
            <div className="pt-2 text-primary font-medium inline-flex items-center gap-1">
              Read featured story →
            </div>
          </div>
        </Link>
      )}

      {/* Latest Posts */}
      <section className="space-y-8">
        <h3 className="text-2xl font-semibold tracking-tight">
          Latest Articles
        </h3>

        <div className="space-y-8">
          {posts.slice(1).map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col md:flex-row gap-6 rounded-2xl border bg-card/50 p-6 hover:bg-card hover:shadow-md transition-all"
            >
              {/* Thumbnail */}
              <div className="relative w-full md:w-64 aspect-[16/10] overflow-hidden rounded-xl shrink-0">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="text-sm text-muted-foreground">
                  {post.date}
                </div>

                <h4 className="text-xl md:text-2xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                  {post.title}
                </h4>

                <p className="text-muted-foreground text-base line-clamp-2">
                  {post.description}
                </p>

                <div className="pt-1 text-primary font-medium inline-flex items-center gap-1">
                  Read more →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  </main>

  <SiteFooter />
</div>


  );
}
