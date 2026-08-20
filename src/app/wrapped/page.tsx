import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WrappedExperience } from "@/components/wrapped/wrapped-experience";
import { auth } from "@/auth";
import { loadWrappedConfig } from "@/lib/admin/settings";
import { buildPageMetadata } from "@/lib/seo/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata("wrapped");

export default async function WrappedPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const config = await loadWrappedConfig();
  if (!config.wrappedEnabled) {
    redirect("/");
  }

  return <WrappedExperience wrappedConfig={config} />;
}
