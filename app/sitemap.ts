import type { MetadataRoute } from "next";

const getBaseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  // Keep only indexable public pages. Blog is intentionally excluded.
  const routes = [
    "/",
    "/about",
    "/careers",
    "/pricing",
    "/privacy",
    "/terms",
    "/api-docs",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
