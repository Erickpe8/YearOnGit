import { AuthenticationError, AuthorizationError, ValidationError } from "@/lib/errors/app-error";
import { jsonError, jsonOk, getApiRequestId } from "@/lib/http/api-response";
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
  const requestId = getApiRequestId(request);
  const session = await requireAuth();
  if (!session?.user?.id) {
    return jsonError(
      new AuthenticationError({
        message: "Unauthorized",
        userMessage: "Your GitHub connection needs attention.",
        statusCode: 401,
        requestId,
      }),
      { requestId, endpoint: "/api/share" },
    );
  }

  const config = await loadWrappedConfig();
  if (!config.features.publicLinks || !config.features.shareWrapped) {
    return jsonError(
      new AuthorizationError({
        message: "Public sharing is disabled",
        userMessage: "Sharing isn't available right now.",
        statusCode: 403,
        requestId,
      }),
      { requestId, endpoint: "/api/share" },
    );
  }

  let body: ShareRequestBody;
  try {
    body = (await request.json()) as ShareRequestBody;
  } catch {
    return jsonError(
      new ValidationError({
        message: "Invalid JSON body",
        userMessage: "That request didn't look valid.",
        requestId,
      }),
      { requestId, endpoint: "/api/share" },
    );
  }

  if (!isWrappedStats(body.stats)) {
    return jsonError(
      new ValidationError({
        message: "Invalid wrapped stats payload",
        userMessage: "That request didn't look valid.",
        requestId,
      }),
      { requestId, endpoint: "/api/share" },
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

  try {
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

      return jsonOk(
        {
          slug: share.slug,
          url: buildShareUrl(share.slug),
          username: share.username,
          year: share.year,
          created: false,
        },
        { requestId },
      );
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

    return jsonOk(
      {
        slug: share.slug,
        url: buildShareUrl(share.slug),
        username: share.username,
        year: share.year,
        created: true,
      },
      { requestId },
    );
  } catch (error) {
    return jsonError(error, { requestId, endpoint: "/api/share" });
  }
}
