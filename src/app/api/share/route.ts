import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loadWrappedConfig } from "@/lib/admin/settings";
import {
  buildShareUrl,
  generateShareSlug,
  isWrappedStats,
  toPublicSharePayload,
} from "@/lib/wrapped/share";
import { WRAPPED_YEAR } from "@/lib/wrapped/year";

type ShareRequestBody = {
  stats?: unknown;
  username?: unknown;
  year?: unknown;
};

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await loadWrappedConfig();
  if (!config.features.publicLinks || !config.features.shareWrapped) {
    return NextResponse.json(
      { error: "Public sharing is disabled" },
      { status: 403 },
    );
  }

  let body: ShareRequestBody;
  try {
    body = (await request.json()) as ShareRequestBody;
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
      ? body.username.trim().replace(/^@/, "")
      : session.user.login ?? session.user.name ?? "developer";

  const year =
    typeof body.year === "number" && Number.isFinite(body.year)
      ? body.year
      : WRAPPED_YEAR;

  const payload = toPublicSharePayload({
    stats: body.stats,
    username,
    year,
  });

  const existing = await prisma.wrappedShare.findUnique({
    where: {
      userId_year: {
        userId: session.user.id,
        year: payload.year,
      },
    },
    select: {
      slug: true,
      isActive: true,
    },
  });

  if (existing) {
    const share = await prisma.wrappedShare.update({
      where: {
        userId_year: {
          userId: session.user.id,
          year: payload.year,
        },
      },
      data: {
        username: payload.username,
        stats: payload.stats as Prisma.InputJsonValue,
        isActive: true,
        revokedAt: null,
      },
      select: {
        slug: true,
        username: true,
        year: true,
      },
    });

    return NextResponse.json({
      slug: share.slug,
      url: buildShareUrl(share.slug),
      username: share.username,
      year: share.year,
      created: false,
    });
  }

  let slug = generateShareSlug();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const collision = await prisma.wrappedShare.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!collision) break;
    slug = generateShareSlug();
  }

  const share = await prisma.wrappedShare.create({
    data: {
      slug,
      userId: session.user.id,
      username: payload.username,
      year: payload.year,
      stats: payload.stats as Prisma.InputJsonValue,
      isActive: true,
    },
    select: {
      slug: true,
      username: true,
      year: true,
    },
  });

  return NextResponse.json({
    slug: share.slug,
    url: buildShareUrl(share.slug),
    username: share.username,
    year: share.year,
    created: true,
  });
}
