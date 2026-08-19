import { PageShell } from "@/components/layout/page-shell";
import type { PublicSiteConfig } from "@/lib/admin/settings";
import { CursorCodeTrail } from "./cursor-code-trail";
import { LandingHero } from "./landing-hero";

export function LandingPage({ siteConfig }: { siteConfig: PublicSiteConfig }) {
  return (
    <PageShell>
      <CursorCodeTrail />
      <main className="relative flex w-full flex-1 flex-col overflow-x-clip">
        <LandingHero siteConfig={siteConfig} />
      </main>
    </PageShell>
  );
}
