import type { Metadata } from "next";
import { HowItWorksPage } from "@/components/info/how-it-works-page";
import { buildPageMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata("howItWorks");

export default function HowItWorksRoute() {
  return <HowItWorksPage />;
}
