import { NextResponse } from "next/server";
import { GitHubGraphQLError } from "@/lib/github/client";
import { isAdminLogin } from "@/lib/admin/access";
import { loadWrappedConfig } from "@/lib/admin/settings";
import { getGitHubAccessToken, requireAuth } from "@/lib/auth/session";
import { fetchViewerWrapped } from "@/lib/wrapped/fetch-viewer-wrapped";

export async function GET(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await loadWrappedConfig();
  const preview =
    new URL(request.url).searchParams.get("preview") === "1" &&
    isAdminLogin(session.user.login);
  if (!config.wrappedEnabled && !preview) {
    return NextResponse.json({ error: "Wrapped is disabled" }, { status: 403 });
  }

  const token = await getGitHubAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "GitHub account not connected" },
      { status: 401 },
    );
  }

  try {
    const payload = await fetchViewerWrapped(token, config);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load wrapped stats";
    console.error("[api/wrapped]", message);

    if (error instanceof GitHubGraphQLError) {
      return NextResponse.json({ error: message }, { status: error.status });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
