import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { loadAppSettings, saveWrappedConfig } from "@/lib/admin/settings";
import { mergeWrappedConfig } from "@/lib/admin/wrapped-config";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await loadAppSettings();
  return NextResponse.json({
    config: settings.config,
    updatedAt: settings.updatedAt,
    updatedByLogin: settings.updatedByLogin,
  });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { config?: unknown; previous?: unknown };
  try {
    body = (await request.json()) as { config?: unknown; previous?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const settings = await saveWrappedConfig({
    config: mergeWrappedConfig(body.config),
    previous: body.previous,
    updatedByLogin: session.user.login ?? "Erickpe8",
  });

  return NextResponse.json({
    config: settings.config,
    updatedAt: settings.updatedAt,
    updatedByLogin: settings.updatedByLogin,
  });
}
