import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = getAppBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/how-it-works", "/faq", "/privacy", "/terms", "/share/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/wrapped",
          "/loading",
          "/auth/",
          "/errors/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
