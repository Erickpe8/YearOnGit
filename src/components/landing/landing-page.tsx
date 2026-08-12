import { PageShell } from "@/components/layout/page-shell";
import { CursorCodeTrail } from "./cursor-code-trail";
import { LandingHero } from "./landing-hero";

export function LandingPage() {
  return (
    <PageShell>
      <CursorCodeTrail />
      <main className="relative flex w-full flex-1 flex-col overflow-x-clip">
        <LandingHero />
      </main>
    </PageShell>
  );
}
