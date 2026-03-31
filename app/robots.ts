import type { MetadataRoute } from "next";

const getBaseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/careers", "/pricing", "/privacy", "/terms", "/api-docs"],
        disallow: [
          "/blog",
          "/dashboard",
          "/api",
          "/auth",
          "/invoices",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
