import type { CSSProperties } from "react";
import type { WrappedStats } from "@/lib/wrapped/types";
import {
  PROFILE_CARD_HEIGHT,
  PROFILE_CARD_WIDTH,
} from "@/lib/profile-card/constants";
import {
  getProfileCardCopy,
  profileCardText,
} from "@/lib/profile-card/copy";
import { parseProfileCardLocale } from "@/lib/profile-card/locale";
import {
  formatMonthName,
  formatWeekdayName,
  formatWeekdayNarrow,
  formatWrappedDate,
} from "@/lib/wrapped/format";
import { WEEKDAY_KEYS } from "@/lib/wrapped/year";

export { PROFILE_CARD_HEIGHT, PROFILE_CARD_WIDTH };

const GREEN = "#39d353";
const MUTED = "#8f9b90";
const SOFT = "#9aab9d";
const INK = "#e8ebe6";
const PAD = 32;
const GAP = 12;
const INNER = PROFILE_CARD_WIDTH - PAD * 2;
const COL3 = (INNER - GAP * 2) / 3;

const panel: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const labelStyle: CSSProperties = {
  display: "flex",
  fontSize: 10,
  color: MUTED,
  fontWeight: 700,
  letterSpacing: 1.1,
  textTransform: "uppercase",
  marginBottom: 5,
};

const HEAT_COLORS = [
  "rgba(255,255,255,0.07)",
  "rgba(57,211,83,0.22)",
  "rgba(57,211,83,0.42)",
  "rgba(57,211,83,0.68)",
  GREEN,
];

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function shortDate(date: string | null, locale: string): string | null {
  if (!date) return null;
  return formatWrappedDate(date, locale);
}

function shortRange(
  start: string | null,
  end: string | null,
  locale: string,
): string | null {
  if (!start || !end) return null;
  const a = shortDate(start, locale);
  const b = shortDate(end, locale);
  if (!a || !b) return null;
  return `${a} → ${b}`;
}

function repoLabel(repo: string | null): string | null {
  if (!repo) return null;
  const name = repo.includes("/") ? repo.split("/").pop() || repo : repo;
  return name.length > 18 ? `${name.slice(0, 16)}…` : name;
}

function HeatCell({ level }: { level: number }) {
  return (
    <div
      style={{
        display: "flex",
        width: 15,
        height: 15,
        borderRadius: 3,
        background: HEAT_COLORS[Math.min(4, Math.max(0, level))] ?? HEAT_COLORS[0],
        marginRight: 3,
        marginBottom: 3,
      }}
    />
  );
}

export type ProfileCardImageProps = {
  username: string;
  year: number;
  stats: WrappedStats | null;
  mode?: "live" | "share";
  locale?: string;
};

export function ProfileCardImage({
  username,
  year,
  stats,
  mode = "live",
  locale: localeProp,
}: ProfileCardImageProps) {
  const locale = parseProfileCardLocale(localeProp);
  const copy = getProfileCardCopy(locale);
  const avatarUrl = stats?.profile.avatarUrl ?? null;
  const displayName = stats?.profile.name?.trim() || `@${username}`;
  const totalContributions = stats?.totalContributions ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const streakRange = shortRange(
    stats?.streakStartDate ?? null,
    stats?.streakEndDate ?? null,
    locale,
  );

  const projectName = repoLabel(stats?.topRepository ?? null);
  const projectCount = stats?.topRepositoryContributions ?? 0;
  const monthName = formatMonthName(stats?.mostActiveMonth ?? null, locale);
  const monthCount = stats?.mostActiveMonthCount ?? 0;
  const topLanguage = stats?.topLanguage ?? null;
  const topLanguagePct = Math.round(stats?.topLanguagePercentage ?? 0);
  const activeDays = stats?.activeDays ?? 0;
  const firstCommit = shortDate(stats?.firstActiveDay ?? null, locale);

  const weekdayKey = stats?.mostActiveWeekday ?? null;
  const weekdayCount =
    weekdayKey && stats?.weekdayContributions
      ? (stats.weekdayContributions.find((w) => w.weekday === weekdayKey)
          ?.contributions ?? 0)
      : (stats?.mostActiveDayCount ?? 0);
  const weekdayLabel = formatWeekdayName(weekdayKey, locale);

  const orgs = stats?.profile.organizationsCount ?? 0;
  const followers = stats?.social.followers ?? 0;
  const yearsOnGit = stats?.profile.yearsOnGit ?? 0;
  const publicRepos = stats?.profile.publicRepositories ?? 0;

  const monthly = stats?.monthlyContributions ?? [];
  const monthMax = Math.max(1, ...monthly.map((m) => m.contributions), 1);

  const heatmap = stats?.heatmap ?? [];
  const weekCount = 32;
  const totalNeeded = weekCount * 7;
  const step = heatmap.length > totalNeeded ? heatmap.length / totalNeeded : 1;
  const miniHeat: number[] = [];
  for (let i = 0; i < totalNeeded; i += 1) {
    const idx = Math.min(heatmap.length - 1, Math.floor(i * step));
    miniHeat.push(heatmap[idx] ?? 0);
  }

  const weekdayBars = WEEKDAY_KEYS.map((key) => {
    const found = stats?.weekdayContributions?.find((w) => w.weekday === key);
    return { key, count: found?.contributions ?? 0 };
  });
  const weekdayMax = Math.max(1, ...weekdayBars.map((b) => b.count));

  const activity = [
    { label: copy.commits, value: stats?.totalCommits ?? 0 },
    { label: copy.prs, value: stats?.totalPullRequests ?? 0 },
    { label: copy.issues, value: stats?.totalIssues ?? 0 },
    { label: copy.reviews, value: stats?.totalCodeReviews ?? 0 },
    { label: copy.repos, value: stats?.activeRepositories ?? 0 },
    { label: copy.languages, value: stats?.languageCount ?? 0 },
    { label: copy.orgs, value: orgs },
  ];
  const chipWidth = (INNER - GAP * (activity.length - 1)) / activity.length;

  const streakLabel = streakRange
    ? profileCardText(copy, "streakWithRange", {
        days: formatCount(longestStreak),
        range: streakRange,
      })
    : profileCardText(copy, "streakDays", {
        days: formatCount(longestStreak),
      });

  const metaParts = [
    yearsOnGit > 0
      ? profileCardText(copy, "joinedYearsAgo", { count: yearsOnGit })
      : null,
    followers > 0
      ? profileCardText(copy, "followedBy", { count: formatCount(followers) })
      : null,
    publicRepos > 0
      ? profileCardText(copy, "publicRepos", { count: formatCount(publicRepos) })
      : null,
  ].filter(Boolean);

  const yearShort = String(year).slice(-2);
  const footerCenter =
    mode === "live"
      ? profileCardText(copy, "footerLive", { year })
      : copy.footerShare;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: PAD,
        background:
          "linear-gradient(155deg, #050805 0%, #0a100c 45%, #07140c 100%)",
        color: INK,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        border: "1px solid rgba(57, 211, 83, 0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "5px 11px",
            borderRadius: 999,
            background: "rgba(57, 211, 83, 0.14)",
            color: GREEN,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 0.3,
          }}
        >
          {`YearOnGit '${yearShort}`}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 13,
            color: MUTED,
            fontWeight: 600,
          }}
        >
          {profileCardText(copy, "wrappedYear", { year })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            width={48}
            height={48}
            alt=""
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              border: "2px solid rgba(57, 211, 83, 0.5)",
              objectFit: "cover",
              marginRight: 12,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: "rgba(57, 211, 83, 0.16)",
              color: GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              marginRight: 12,
              border: "2px solid rgba(57, 211, 83, 0.45)",
            }}
          >
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            {displayName}
          </div>
          <div style={{ display: "flex", fontSize: 13, color: SOFT, marginTop: 2 }}>
            {`@${username} · ${profileCardText(copy, "yourYearOnGitHub", { year })}`}
          </div>
          {metaParts.length > 0 ? (
            <div
              style={{
                display: "flex",
                fontSize: 11,
                color: "#6f7b72",
                marginTop: 3,
              }}
            >
              {metaParts.join("  ·  ")}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          marginBottom: GAP,
          padding: "6px 16px 8px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(57, 211, 83, 0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 10,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: MUTED,
            fontWeight: 700,
            marginBottom: 2,
          }}
        >
          {copy.totalContributions}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 50,
            fontWeight: 900,
            color: GREEN,
            lineHeight: 0.95,
            letterSpacing: -1.2,
            marginBottom: 4,
          }}
        >
          {formatCount(totalContributions)}
        </div>
        <div
          style={{
            display: "flex",
            padding: "4px 12px",
            borderRadius: 999,
            background: "rgba(57, 211, 83, 0.12)",
            border: "1px solid rgba(57, 211, 83, 0.28)",
            color: GREEN,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {streakLabel}
        </div>
      </div>

      <div style={{ display: "flex", width: "100%", marginBottom: GAP }}>
        <div
          style={{
            ...panel,
            width: COL3,
            marginRight: GAP,
            background: "rgba(57, 211, 83, 0.1)",
            border: "1px solid rgba(57, 211, 83, 0.28)",
          }}
        >
          <div style={labelStyle}>{copy.projectOfTheYear}</div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 800,
              color: GREEN,
              lineHeight: 1.15,
              marginBottom: 2,
            }}
          >
            {projectName ?? "—"}
          </div>
          <div style={{ display: "flex", fontSize: 12, color: SOFT }}>
            {projectName && projectCount > 0
              ? profileCardText(copy, "contributionsCount", {
                  count: formatCount(projectCount),
                })
              : copy.noStandoutProject}
          </div>
        </div>

        <div style={{ ...panel, width: COL3, marginRight: GAP }}>
          <div style={labelStyle}>{copy.mostActiveMonth}</div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 800,
              color: INK,
              lineHeight: 1.15,
              marginBottom: 2,
            }}
          >
            {monthName ?? "—"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 12,
              color: SOFT,
              marginBottom: 6,
            }}
          >
            {monthName && monthCount > 0
              ? profileCardText(copy, "contributionsCount", {
                  count: formatCount(monthCount),
                })
              : "—"}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", height: 16 }}>
            {monthly.map((m) => (
              <div
                key={m.month}
                style={{
                  display: "flex",
                  width: 16,
                  height: Math.max(3, Math.round((m.contributions / monthMax) * 16)),
                  borderRadius: 2,
                  background:
                    m.month === stats?.mostActiveMonth
                      ? GREEN
                      : "rgba(57, 211, 83, 0.28)",
                  marginRight: 4,
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            ...panel,
            width: COL3,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: COL3 - 72,
            }}
          >
            <div style={labelStyle}>{copy.topLanguage}</div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 800,
                color: INK,
                marginBottom: 2,
              }}
            >
              {topLanguage ?? "—"}
            </div>
            <div style={{ display: "flex", fontSize: 12, color: SOFT }}>
              {topLanguage && topLanguagePct > 0
                ? profileCardText(copy, "percentOfYear", {
                    percent: topLanguagePct,
                  })
                : profileCardText(copy, "languagesCount", {
                    count: formatCount(stats?.languageCount ?? 0),
                  })}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              width: 42,
              height: 42,
              borderRadius: 999,
              border: `4px solid ${topLanguagePct > 0 ? GREEN : "rgba(255,255,255,0.12)"}`,
              alignItems: "center",
              justifyContent: "center",
              color: GREEN,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {topLanguagePct > 0 ? `${topLanguagePct}%` : "—"}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "#6f7b72",
          marginBottom: 6,
        }}
      >
        {copy.activity}
      </div>
      <div style={{ display: "flex", width: "100%", marginBottom: 12 }}>
        {activity.map((item, index) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              flexDirection: "column",
              width: chipWidth,
              marginRight: index === activity.length - 1 ? 0 : GAP,
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 10,
                color: MUTED,
                fontWeight: 600,
                marginBottom: 3,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 800,
                color: INK,
                lineHeight: 1,
              }}
            >
              {formatCount(item.value)}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          flexGrow: 1,
          padding: "16px 18px",
          borderRadius: 16,
          background: "rgba(57, 211, 83, 0.06)",
          border: "1px solid rgba(57, 211, 83, 0.18)",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 210,
            marginRight: 20,
          }}
        >
          <div style={labelStyle}>{copy.mostActiveDay}</div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 800,
              color: INK,
              marginBottom: 4,
              lineHeight: 1.05,
            }}
          >
            {weekdayLabel ?? "—"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 13,
              color: SOFT,
              marginBottom: 12,
            }}
          >
            {weekdayLabel && weekdayCount > 0
              ? profileCardText(copy, "contributionsCount", {
                  count: formatCount(weekdayCount),
                })
              : "—"}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", height: 52 }}>
            {weekdayBars.map((bar) => (
              <div
                key={bar.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginRight: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 12,
                    height: Math.max(6, Math.round((bar.count / weekdayMax) * 40)),
                    borderRadius: 3,
                    background:
                      bar.key === weekdayKey ? GREEN : "rgba(57, 211, 83, 0.28)",
                    marginBottom: 5,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    fontSize: 10,
                    color: bar.key === weekdayKey ? GREEN : "#6f7b72",
                    fontWeight: 700,
                  }}
                >
                  {formatWeekdayNarrow(bar.key, locale) ?? ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 150,
            marginRight: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 800,
              color: GREEN,
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {formatCount(activeDays)}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 13,
              color: SOFT,
              marginBottom: 14,
            }}
          >
            {copy.activeDays}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              fontWeight: 700,
              color: INK,
              marginBottom: 3,
            }}
          >
            {firstCommit ?? "—"}
          </div>
          <div style={{ display: "flex", fontSize: 13, color: SOFT }}>
            {copy.firstCommit}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 10,
              color: MUTED,
              fontWeight: 700,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {profileCardText(copy, "heatmap", { year })}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {Array.from({ length: 7 }).map((_, day) => (
              <div key={day} style={{ display: "flex" }}>
                {Array.from({ length: weekCount }).map((__, week) => (
                  <HeatCell
                    key={`${day}-${week}`}
                    level={miniHeat[week * 7 + day] ?? 0}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          paddingTop: 10,
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", color: GREEN }}>yearongit.com</div>
        <div style={{ display: "flex", color: "#6f7b72" }}>{footerCenter}</div>
        <div style={{ display: "flex", color: GREEN }}>
          {profileCardText(copy, "yearOnly", { year })}
        </div>
      </div>
    </div>
  );
}

export function profileCardCacheHeaders(
  refreshedAt: Date,
  year?: number,
  locale?: string,
): HeadersInit {
  const lang = parseProfileCardLocale(locale);
  const etag = `"pc-lang1-${year ?? "y"}-${lang}-${refreshedAt.getTime()}"`;
  return {
    "Cache-Control":
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    "CDN-Cache-Control":
      "public, s-maxage=3600, stale-while-revalidate=86400",
    ETag: etag,
    "Last-Modified": refreshedAt.toUTCString(),
  };
}
