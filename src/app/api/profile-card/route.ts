import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { upsertProfileCard } from "@/lib/profile-card/store";
import { parseProfileCardLocale } from "@/lib/profile-card/locale";
import { loadWrappedConfig } from "@/lib/admin/settings";
import {
  buildProfileCardMarkdown,
  buildProfileCardUrl,
  normalizeProfileUsername,
} from "@/lib/profile-card/urls";
import { isWrappedStats } from "@/lib/wrapped/share";
import { WRAPPED_YEAR } from "@/lib/wrapped/year";

type Body = {
  stats?: unknown;
  username?: unknown;
  year?: unknown;
  shareSlug?: unknown;
  locale?: unknown;
};

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wrappedConfig = await loadWrappedConfig();
    if (!wrappedConfig.features.publicCard && !wrappedConfig.features.copyMarkdown) {
      return NextResponse.json(
        { error: "Public cards are disabled" },
        { status: 403 },
      );
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!isWrappedStats(body.stats)) {
      return NextResponse.json(
        { error: "Invalid wrapped stats payload" },
        { status: 400 },
      );
    }

    const username =
      typeof body.username === "string" && body.username.trim()
        ? normalizeProfileUsername(body.username)
        : normalizeProfileUsername(
            session.user.login ?? session.user.name ?? "developer",
          );

    const year =
      typeof body.year === "number" && Number.isFinite(body.year)
        ? body.year
        : WRAPPED_YEAR;

    const shareSlug =
      typeof body.shareSlug === "string" && body.shareSlug.trim()
        ? body.shareSlug.trim()
        : undefined;

    const locale = parseProfileCardLocale(
      typeof body.locale === "string" ? body.locale : undefined,
    );

    const card = await upsertProfileCard({
      userId: session.user.id,
      username,
      year,
      stats: body.stats,
      markRefreshed: true,
    });

    const cardUrl = buildProfileCardUrl(
      card.username,
      card.year,
      undefined,
      locale,
    );
    const markdown = buildProfileCardMarkdown({
      username: card.username,
      year: card.year,
      shareSlug,
      locale,
    });

    return NextResponse.json({
      username: card.username,
      year: card.year,
      cardUrl,
      markdown,
      refreshedAt: card.refreshedAt.toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save profile card";
    console.error("[api/profile-card]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
