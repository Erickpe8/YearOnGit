import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import {
  loadAppSettings,
  publicSiteConfig,
} from "@/lib/admin/settings";
import { buildPageMetadata } from "@/lib/seo/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata("landing");

export default async function Home() {
  const settings = await loadAppSettings();
  return <LandingPage siteConfig={publicSiteConfig(settings)} />;
}
