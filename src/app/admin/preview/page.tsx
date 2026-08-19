import { redirect } from "next/navigation";
import { AdminPreviewClient } from "@/components/admin/admin-preview-client";
import { requireAdmin } from "@/lib/admin/require-admin";
import { loadWrappedConfig } from "@/lib/admin/settings";
import { getGitHubAccessToken } from "@/lib/auth/session";
import { fetchViewerWrapped } from "@/lib/wrapped/fetch-viewer-wrapped";

export const metadata = {
  title: "Preview · Admin · YearOnGit",
  robots: { index: false, follow: false },
};

type PreviewPageProps = {
  searchParams: Promise<{ slides?: string; slide?: string }>;
};

export default async function AdminPreviewPage({ searchParams }: PreviewPageProps) {
  const session = await requireAdmin();
  if (!session) {
    redirect("/");
  }

  const params = await searchParams;
  const includeDisabled = params.slides === "all";
  const initialSlideKey = params.slide?.trim() || undefined;
  const config = await loadWrappedConfig();
  const token = await getGitHubAccessToken();

  if (!token) {
    return (
      <AdminPreviewClient
        error="No hay una cuenta de GitHub conectada para previsualizar."
      />
    );
  }

  try {
    const payload = await fetchViewerWrapped(token, config);
    return (
      <AdminPreviewClient
        payload={payload}
        config={config}
        includeDisabled={includeDisabled}
        initialSlideKey={initialSlideKey}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo cargar el preview.";
    return <AdminPreviewClient error={message} />;
  }
}
