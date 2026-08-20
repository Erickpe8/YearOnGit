import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoadingScreen } from "@/components/loading/loading-screen";
import { auth } from "@/auth";
import { isAdminLogin } from "@/lib/admin/access";
import { loadWrappedConfig } from "@/lib/admin/settings";
import { buildPageMetadata } from "@/lib/seo/pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata("loading");

export default async function LoadingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const config = await loadWrappedConfig();
  if (!config.wrappedEnabled) {
    redirect(isAdminLogin(session.user.login) ? "/admin" : "/");
  }

  return <LoadingScreen musicEnabled={config.features.music} />;
}
