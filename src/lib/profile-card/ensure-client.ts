import { fetchJson } from "@/lib/http/fetch-json";
import type { WrappedPayload } from "@/lib/wrapped/types";

export async function ensureProfileCardMarkdown(
  payload: WrappedPayload,
  shareSlug?: string,
  locale?: string,
): Promise<{
  markdown: string;
  cardUrl: string;
  username: string;
}> {
  const data = await fetchJson<{
    markdown?: string;
    cardUrl?: string;
    username?: string;
  }>("/api/profile-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stats: payload.stats,
      username: payload.username,
      year: payload.year,
      shareSlug,
      locale,
    }),
    retries: 2,
  });

  if (!data.markdown || !data.cardUrl || !data.username) {
    throw new Error("Missing profile card response");
  }

  return {
    markdown: data.markdown,
    cardUrl: data.cardUrl,
    username: data.username,
  };
}
