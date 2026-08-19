import { AuthenticationError, AuthorizationError, ValidationError } from "@/lib/errors/app-error";
import { jsonError, jsonOk, getApiRequestId } from "@/lib/http/api-response";
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
  const requestId = getApiRequestId(request);
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return jsonError(
        new AuthenticationError({
          message: "Unauthorized",
          userMessage: "Your GitHub connection needs attention.",
          statusCode: 401,
          requestId,
        }),
        { requestId, endpoint: "/api/profile-card" },
      );
    }

    const wrappedConfig = await loadWrappedConfig();
    if (!wrappedConfig.features.publicCard && !wrappedConfig.features.copyMarkdown) {
      return jsonError(
        new AuthorizationError({
          message: "Public cards are disabled",
          userMessage: "Sharing isn't available right now.",
          statusCode: 403,
          requestId,
        }),
        { requestId, endpoint: "/api/profile-card" },
      );
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return jsonError(
        new ValidationError({
          message: "Invalid JSON body",
          userMessage: "That request didn't look valid.",
          requestId,
        }),
        { requestId, endpoint: "/api/profile-card" },
      );
    }

    if (!isWrappedStats(body.stats)) {
      return jsonError(
        new ValidationError({
          message: "Invalid wrapped stats payload",
          userMessage: "That request didn't look valid.",
          requestId,
        }),
        { requestId, endpoint: "/api/profile-card" },
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

    return jsonOk(
      {
        username: card.username,
        year: card.year,
        cardUrl,
        markdown,
        refreshedAt: card.refreshedAt.toISOString(),
      },
      { requestId },
    );
  } catch (error) {
    return jsonError(error, { requestId, endpoint: "/api/profile-card" });
  }
}
