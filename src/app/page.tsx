import { LandingPage } from "@/components/landing/landing-page";
import {
  loadAppSettings,
  publicSiteConfig,
} from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await loadAppSettings();
  return <LandingPage siteConfig={publicSiteConfig(settings)} />;
}
