import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";
import { SEO_PAGES } from "@/lib/seo/pages";

/**
 * Public indexable routes only.
 * No /page/2-style pagination exists; authenticated and admin routes stay out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppBaseUrl();
  const now = new Date();

  const publicPages = [
    SEO_PAGES.landing,
    SEO_PAGES.howItWorks,
    SEO_PAGES.faq,
    SEO_PAGES.privacy,
    SEO_PAGES.terms,
  ] as const;

  return publicPages.map((page) => ({
    url: page.path === "/" ? base : `${base}${page.path}`,
    lastModified: now,
    changeFrequency: page.path === "/" ? "weekly" : "monthly",
    priority: page.path === "/" ? 1 : 0.6,
  }));
}
