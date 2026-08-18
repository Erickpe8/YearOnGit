import { ImageResponse } from "next/og";
import {
  PROFILE_CARD_HEIGHT,
  PROFILE_CARD_WIDTH,
  ProfileCardImage,
} from "@/lib/profile-card/card-image";
import { loadActiveShare } from "@/lib/wrapped/load-share";
import { parseProfileCardLocale } from "@/lib/profile-card/locale";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const share = await loadActiveShare(slug);

  const username = share?.username ?? "developer";
  const year = share?.year ?? 2026;
  const locale = parseProfileCardLocale(
    new URL(request.url).searchParams.get("lang"),
  );

  return new ImageResponse(
    (
      <ProfileCardImage
        username={username}
        year={year}
        stats={share?.stats ?? null}
        mode="share"
        locale={locale}
      />
    ),
    {
      width: PROFILE_CARD_WIDTH,
      height: PROFILE_CARD_HEIGHT,
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
