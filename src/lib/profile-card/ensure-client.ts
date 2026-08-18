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
  const response = await fetch("/api/profile-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stats: payload.stats,
      username: payload.username,
      year: payload.year,
      shareSlug,
      locale,
    }),
  });

  if (!response.ok) {
    let detail = "Failed to create profile card";
    try {
      const err = (await response.json()) as { error?: string };
      if (err.error) detail = err.error;
    } catch {}
    throw new Error(detail);
  }

  const data = (await response.json()) as {
    markdown?: string;
    cardUrl?: string;
    username?: string;
  };

  if (!data.markdown || !data.cardUrl || !data.username) {
    throw new Error("Missing profile card response");
  }

  return {
    markdown: data.markdown,
    cardUrl: data.cardUrl,
    username: data.username,
  };
}
