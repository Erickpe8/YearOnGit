import { NextResponse } from "next/server";
import { refreshProfileCard } from "@/lib/profile-card/refresh";
import { listStaleProfileCards } from "@/lib/profile-card/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stale = await listStaleProfileCards(50);
  let refreshed = 0;
  let failed = 0;

  for (const card of stale) {
    const ok = await refreshProfileCard(card.usernameKey, card.year);
    if (ok) refreshed += 1;
    else failed += 1;
  }

  return NextResponse.json({
    checked: stale.length,
    refreshed,
    failed,
  });
}
