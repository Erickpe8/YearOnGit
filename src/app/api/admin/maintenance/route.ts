import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { loadWrappedConfig, saveWrappedConfig } from "@/lib/admin/settings";
import { recordAdminLog } from "@/lib/admin/audit";
import { DEFAULT_WRAPPED_CONFIG } from "@/lib/admin/wrapped-config";
import { getGitHubAccessToken } from "@/lib/auth/session";
import { fetchViewerWrapped } from "@/lib/wrapped/fetch-viewer-wrapped";

type Action = "reset" | "clear-cache" | "regenerate";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: unknown };
  try {
    body = (await request.json()) as { action?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "reset" && action !== "clear-cache" && action !== "regenerate") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const login = session.user.login ?? "Erickpe8";

  if ((action as Action) === "reset") {
    const settings = await saveWrappedConfig({
      config: DEFAULT_WRAPPED_CONFIG,
      updatedByLogin: login,
      logAction: "config.reset",
      logSummary:
        "Restableció la configuración del Wrapped a los valores por defecto",
    });
    return NextResponse.json({
      ok: true,
      action,
      config: settings.config,
      updatedAt: settings.updatedAt,
    });
  }

  if ((action as Action) === "clear-cache") {
    const current = await loadWrappedConfig();
    const settings = await saveWrappedConfig({
      config: { ...current, cacheEpoch: current.cacheEpoch + 1 },
      updatedByLogin: login,
      logAction: "cache.clear",
      logSummary: "Limpió la caché de estadísticas",
    });
    return NextResponse.json({
      ok: true,
      action,
      config: settings.config,
      updatedAt: settings.updatedAt,
    });
  }

  const token = await getGitHubAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "GitHub account not connected" },
      { status: 401 },
    );
  }

  const config = await loadWrappedConfig();
  await fetchViewerWrapped(token, config);
  await recordAdminLog({
    action: "stats.regenerate",
    summary: "Regeneró las estadísticas desde GitHub",
    actorLogin: login,
  });
  return NextResponse.json({ ok: true, action });
}
