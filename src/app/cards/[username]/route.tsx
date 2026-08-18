import { NextResponse } from "next/server";
import {
  isValidProfileUsername,
  normalizeProfileUsername,
} from "@/lib/profile-card/urls";
import { WRAPPED_YEAR } from "@/lib/wrapped/year";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ username: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { username: raw } = await params;
  const username = normalizeProfileUsername(raw);

  if (!isValidProfileUsername(username)) {
    return new Response("Not found", { status: 404 });
  }

  const target = new URL(
    `/cards/${encodeURIComponent(username)}/${WRAPPED_YEAR}.png`,
    request.url,
  );
  const incoming = new URL(request.url);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target, 308);
}
