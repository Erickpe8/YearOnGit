import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo/pages";

export const metadata: Metadata = buildPageMetadata("terms");

export default function TermsPage() {
  return <LegalPage type="terms" />;
}
