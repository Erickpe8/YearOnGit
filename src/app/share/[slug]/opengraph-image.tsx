import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { isValidShareSlug, isWrappedStats } from "@/lib/wrapped/share";
import type { WrappedStats } from "@/lib/wrapped/types";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ShareOpenGraphImage({ params }: Props) {
  const { slug } = await params;

  let username = "developer";
  let year = 2026;
  let stats: Pick<
    WrappedStats,
    | "totalContributions"
    | "totalCommits"
    | "longestStreak"
    | "languageCount"
  > = {
    totalContributions: 0,
    totalCommits: 0,
    longestStreak: 0,
    languageCount: 0,
  };

  if (isValidShareSlug(slug)) {
    const share = await prisma.wrappedShare.findFirst({
      where: { slug: slug.toLowerCase(), isActive: true },
      select: { username: true, year: true, stats: true },
    });

    if (share && isWrappedStats(share.stats)) {
      username = share.username;
      year = share.year;
      const full = share.stats as WrappedStats;
      stats = {
        totalContributions: full.totalContributions,
        totalCommits: full.totalCommits,
        longestStreak: full.longestStreak,
        languageCount: full.languageCount,
      };
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(145deg, #0a0a0a 0%, #10141a 55%, #0d1f12 100%)",
          color: "#dfe2eb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 28, color: "#39d353", fontWeight: 700 }}>
            YearOnGit
          </div>
          <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.1 }}>
            @{username}&apos;s Year on Git {year}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 28,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "contributions", value: stats.totalContributions },
            { label: "commits", value: stats.totalCommits },
            { label: "day streak", value: stats.longestStreak },
            { label: "languages", value: stats.languageCount },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 180,
                padding: "18px 22px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 40, fontWeight: 800, color: "#39d353" }}>
                {item.value.toLocaleString("en-US")}
              </div>
              <div style={{ fontSize: 20, color: "#bccbb6" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
