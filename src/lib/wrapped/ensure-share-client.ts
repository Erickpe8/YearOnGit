import type { WrappedPayload } from "@/lib/wrapped/types";

export async function ensureShareSlug(payload: WrappedPayload): Promise<{
  url: string;
  slug: string;
}> {
  const response = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stats: payload.stats,
      username: payload.username,
      year: payload.year,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create share link");
  }

  const data = (await response.json()) as { url?: string; slug?: string };
  if (!data.url || !data.slug) {
    throw new Error("Missing share URL");
  }

  return { url: data.url, slug: data.slug };
}

export async function ensureShareUrl(payload: WrappedPayload): Promise<string> {
  const { url } = await ensureShareSlug(payload);
  return url;
}
