import { ImageResponse } from "next/og";
import { after } from "next/server";
import {
  PROFILE_CARD_HEIGHT,
  PROFILE_CARD_WIDTH,
  ProfileCardImage,
  profileCardCacheHeaders,
} from "@/lib/profile-card/card-image";
import { refreshProfileCard } from "@/lib/profile-card/refresh";
import {
  isProfileCardRefreshLocked,
  isProfileCardStale,
  loadProfileCard,
} from "@/lib/profile-card/store";
import {
  isValidProfileUsername,
  normalizeProfileUsername,
} from "@/lib/profile-card/urls";
import { parseProfileCardLocale } from "@/lib/profile-card/locale";
import {
  canRefreshProfileCardYear,
  normalizeCardYear,
} from "@/lib/profile-card/year-scope";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ username: string; year: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { username: rawUsername, year: rawYear } = await params;
  const username = normalizeProfileUsername(rawUsername);
  const year = normalizeCardYear(rawYear);

  if (!isValidProfileUsername(username) || year === null) {
    return new Response("Not found", { status: 404 });
  }

  const card = await loadProfileCard(username, year);
  if (!card) {
    return new Response("Profile card not found", { status: 404 });
  }

  const yearOpen = canRefreshProfileCardYear(year);
  const stale = isProfileCardStale(card.refreshedAt);
  const locked = isProfileCardRefreshLocked(card.refreshLockUntil);

  if (yearOpen && stale && !locked) {
    after(() => {
      void refreshProfileCard(card.usernameKey, year);
    });
  }

  const ifNoneMatch = request.headers.get("if-none-match");
  const locale = parseProfileCardLocale(
    new URL(request.url).searchParams.get("lang"),
  );
  const headers = profileCardCacheHeaders(card.refreshedAt, year, locale);
  const etag = (headers as Record<string, string>).ETag;
  if (ifNoneMatch && etag && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers,
    });
  }

  return new ImageResponse(
    (
      <ProfileCardImage
        username={card.username}
        year={card.year}
        stats={card.stats}
        mode="live"
        locale={locale}
      />
    ),
    {
      width: PROFILE_CARD_WIDTH,
      height: PROFILE_CARD_HEIGHT,
      headers,
    },
  );
}
