import { fetchJson } from "@/lib/http/fetch-json";
import type { WrappedPayload } from "@/lib/wrapped/types";

export async function ensureShareSlug(payload: WrappedPayload): Promise<{
  url: string;
  slug: string;
}> {
  const data = await fetchJson<{ url?: string; slug?: string }>("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stats: payload.stats,
      username: payload.username,
      year: payload.year,
    }),
    retries: 2,
  });

  if (!data.url || !data.slug) {
    throw new Error("Missing share URL");
  }

  return { url: data.url, slug: data.slug };
}

export async function ensureShareUrl(payload: WrappedPayload): Promise<string> {
  const { url } = await ensureShareSlug(payload);
  return url;
}
