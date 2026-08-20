import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import type { PublicSiteConfig } from "@/lib/admin/settings";
import { absoluteUrl, SEO_PAGES } from "@/lib/seo/pages";
import { brandName } from "@/lib/brand/assets";
import { CursorCodeTrail } from "./cursor-code-trail";
import { LandingHero } from "./landing-hero";

export function LandingPage({ siteConfig }: { siteConfig: PublicSiteConfig }) {
  const webAppLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: brandName,
    url: absoluteUrl("/"),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: SEO_PAGES.landing.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <PageShell footerCompact>
      <JsonLd data={webAppLd} />
      <CursorCodeTrail />
      <main className="relative flex w-full flex-col overflow-x-clip pb-16 md:pb-3">
        <LandingHero siteConfig={siteConfig} />
      </main>
    </PageShell>
  );
}
