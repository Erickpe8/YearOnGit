import { WRAPPED_DAYS_IN_YEAR, WRAPPED_YEAR } from "@/lib/wrapped/year";
import type { Achievement, Highlight, WrappedStats } from "@/lib/wrapped/types";

export const SLIDE_CATALOG = [
  { id: "overview", name: "Intro" },
  { id: "contribution-types", name: "Cómo contribuiste" },
  { id: "favorite-repo", name: "Proyecto del año" },
  { id: "heatmap", name: "Tu año en GitHub" },
  { id: "highlight", name: "Insight destacado" },
  { id: "languages", name: "Lenguajes" },
  { id: "community", name: "Comunidad" },
  { id: "achievements", name: "Logros" },
  { id: "streak", name: "Racha" },
  { id: "summary", name: "Resumen" },
] as const;

export type SlideId = (typeof SLIDE_CATALOG)[number]["id"];

export const STAT_CATALOG = [
  { id: "commits", name: "Commits" },
  { id: "contributions", name: "Contributions" },
  { id: "pullRequests", name: "Pull Requests" },
  { id: "issues", name: "Issues" },
  { id: "codeReviews", name: "Code Reviews" },
  { id: "repositories", name: "Repositories" },
  { id: "languages", name: "Languages" },
  { id: "stars", name: "Stars" },
  { id: "followers", name: "Followers" },
  { id: "following", name: "Following" },
  { id: "friends", name: "Friends" },
  { id: "organizations", name: "Organizations" },
  { id: "streak", name: "Streak" },
  { id: "favoriteDay", name: "Favorite day" },
  { id: "favoriteMonth", name: "Favorite month" },
  { id: "perfectWeeks", name: "Perfect weeks" },
  { id: "averageContributions", name: "Average contributions" },
  { id: "firstCommit", name: "First commit" },
  { id: "lastCommit", name: "Last commit" },
] as const;

export type StatId = (typeof STAT_CATALOG)[number]["id"];

export const FEATURE_CATALOG = [
  { id: "autoplay", name: "Autoplay" },
  { id: "animations", name: "Animaciones" },
  { id: "confetti", name: "Confetti" },
  { id: "music", name: "Música" },
  { id: "shareWrapped", name: "Compartir Wrapped" },
  { id: "copyMarkdown", name: "Copiar Markdown" },
  { id: "publicLinks", name: "Links públicos" },
  { id: "publicCard", name: "Tarjeta pública" },
  { id: "swipeNav", name: "Navegación mediante swipe" },
  { id: "arrowNav", name: "Navegación mediante flechas" },
] as const;

export type FeatureId = (typeof FEATURE_CATALOG)[number]["id"];

export type SlideToggle = {
  id: SlideId;
  enabled: boolean;
};

export type WrappedFeatures = Record<FeatureId, boolean>;
export type WrappedStatsToggles = Record<StatId, boolean>;

export type WrappedAdminConfig = {
  wrappedEnabled: boolean;
  wrappedYear: number;
  periodStart: string;
  periodEnd: string;
  slides: SlideToggle[];
  features: WrappedFeatures;
  stats: WrappedStatsToggles;
  cacheEpoch: number;
};

export type WrappedQueryWindow = {
  year: number;
  from: string;
  to: string;
  daysInYear: number;
  periodStart: string;
  periodEnd: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function defaultPeriod(year: number) {
  return {
    periodStart: `${year}-01-01`,
    periodEnd: `${year}-12-31`,
  };
}

function allTrue<T extends string>(ids: readonly T[]): Record<T, boolean> {
  return Object.fromEntries(ids.map((id) => [id, true])) as Record<T, boolean>;
}

export const DEFAULT_WRAPPED_CONFIG: WrappedAdminConfig = {
  wrappedEnabled: true,
  wrappedYear: WRAPPED_YEAR,
  ...defaultPeriod(WRAPPED_YEAR),
  slides: SLIDE_CATALOG.map((slide) => ({ id: slide.id, enabled: true })),
  features: allTrue(FEATURE_CATALOG.map((item) => item.id)),
  stats: allTrue(STAT_CATALOG.map((item) => item.id)),
  cacheEpoch: 0,
};

export function isSlideId(value: string): value is SlideId {
  return SLIDE_CATALOG.some((slide) => slide.id === value);
}

export function isStatId(value: string): value is StatId {
  return STAT_CATALOG.some((stat) => stat.id === value);
}

export function isFeatureId(value: string): value is FeatureId {
  return FEATURE_CATALOG.some((feature) => feature.id === value);
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asYear(value: unknown, fallback: number): number {
  const year = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(year) || year < 2008 || year > 2100) return fallback;
  return year;
}

function asDate(value: unknown, fallback: string): string {
  if (typeof value === "string" && DATE_RE.test(value)) return value;
  return fallback;
}

function mergeSlides(raw: unknown): SlideToggle[] {
  const byId = new Map<SlideId, boolean>();
  const order: SlideId[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const record = item as { id?: unknown; enabled?: unknown };
      if (typeof record.id !== "string" || !isSlideId(record.id)) continue;
      if (byId.has(record.id)) continue;
      byId.set(record.id, record.enabled !== false);
      order.push(record.id);
    }
  }

  const merged: SlideToggle[] = [];
  for (const id of order) {
    merged.push({ id, enabled: byId.get(id) ?? true });
  }
  for (const slide of SLIDE_CATALOG) {
    if (byId.has(slide.id)) continue;
    merged.push({ id: slide.id, enabled: true });
  }
  return merged;
}

export function mergeWrappedConfig(raw: unknown): WrappedAdminConfig {
  let parsed: unknown = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = {};
    }
  }
  const input =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  const wrappedYear = asYear(input.wrappedYear, DEFAULT_WRAPPED_CONFIG.wrappedYear);
  const fallbackPeriod = defaultPeriod(wrappedYear);

  const features = { ...DEFAULT_WRAPPED_CONFIG.features };
  if (input.features && typeof input.features === "object") {
    const source = input.features as Record<string, unknown>;
    for (const feature of FEATURE_CATALOG) {
      features[feature.id] = asBoolean(source[feature.id], features[feature.id]);
    }
  }

  const stats = { ...DEFAULT_WRAPPED_CONFIG.stats };
  if (input.stats && typeof input.stats === "object") {
    const source = input.stats as Record<string, unknown>;
    for (const stat of STAT_CATALOG) {
      stats[stat.id] = asBoolean(source[stat.id], stats[stat.id]);
    }
  }

  return {
    wrappedEnabled: asBoolean(
      input.wrappedEnabled,
      DEFAULT_WRAPPED_CONFIG.wrappedEnabled,
    ),
    wrappedYear,
    periodStart: asDate(input.periodStart, fallbackPeriod.periodStart),
    periodEnd: asDate(input.periodEnd, fallbackPeriod.periodEnd),
    slides: mergeSlides(input.slides),
    features,
    stats,
    cacheEpoch:
      typeof input.cacheEpoch === "number" && Number.isFinite(input.cacheEpoch)
        ? Math.max(0, Math.floor(input.cacheEpoch))
        : 0,
  };
}

export function utcDayCount(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) {
    return WRAPPED_DAYS_IN_YEAR;
  }
  return Math.floor((to - from) / 86_400_000) + 1;
}

export function wrappedQueryWindow(
  config: WrappedAdminConfig,
): WrappedQueryWindow {
  const periodStart = config.periodStart;
  const periodEnd =
    config.periodEnd < periodStart ? periodStart : config.periodEnd;
  const from = `${periodStart}T00:00:00.000Z`;
  const to = `${periodEnd}T23:59:59.999Z`;
  return {
    year: config.wrappedYear,
    from,
    to,
    daysInYear: utcDayCount(from, to),
    periodStart,
    periodEnd,
  };
}

export function countSlides(config: WrappedAdminConfig) {
  const total = config.slides.length;
  const enabled = config.slides.filter((slide) => slide.enabled).length;
  return { total, enabled, disabled: total - enabled };
}

export function slideName(id: SlideId): string {
  return SLIDE_CATALOG.find((slide) => slide.id === id)?.name ?? id;
}

const HIGHLIGHT_STAT: Record<string, StatId> = {
  best_month: "favoriteMonth",
  activity_rate: "contributions",
  private_share: "repositories",
  orgs_active: "organizations",
  most_starred: "stars",
  friends: "friends",
  streak: "streak",
  top_language: "languages",
  favorite_repo: "repositories",
};

const ACHIEVEMENT_STAT: Record<string, StatId> = {
  commit_machine: "commits",
  streak_master: "streak",
  polyglot: "languages",
  open_source_hero: "repositories",
  repo_creator: "repositories",
  community_builder: "friends",
  weekend_warrior: "contributions",
  star_collector: "stars",
};

function keepHighlight(highlight: Highlight, stats: WrappedStatsToggles) {
  const required = HIGHLIGHT_STAT[highlight.id];
  return !required || stats[required];
}

function keepAchievement(item: Achievement, stats: WrappedStatsToggles) {
  const required = ACHIEVEMENT_STAT[item.id];
  return !required || stats[required];
}

export function applyAdminStats(
  stats: WrappedStats,
  config: WrappedAdminConfig,
): WrappedStats {
  const next = structuredClone(stats);
  const on = config.stats;

  if (!on.commits) {
    next.totalCommits = 0;
    next.activity.totalCommits = 0;
  }
  if (!on.contributions) {
    next.totalContributions = 0;
    next.activity.totalContributions = 0;
    next.heatmap = next.heatmap.map(() => 0);
    next.calendar.heatmap = next.calendar.heatmap.map(() => 0);
  }
  if (!on.pullRequests) {
    next.totalPullRequests = 0;
    next.activity.totalPullRequests = 0;
  }
  if (!on.issues) {
    next.totalIssues = 0;
    next.activity.totalIssues = 0;
  }
  if (!on.codeReviews) {
    next.totalCodeReviews = 0;
    next.activity.totalCodeReviews = 0;
  }

  next.contributionTypes = next.contributionTypes.map((entry) => {
    const enabled =
      (entry.type === "commits" && on.commits) ||
      (entry.type === "pullRequests" && on.pullRequests) ||
      (entry.type === "issues" && on.issues) ||
      (entry.type === "codeReviews" && on.codeReviews);
    return enabled ? entry : { ...entry, count: 0, shareOfTypedActivity: 0 };
  });
  next.activity.contributionTypes = next.contributionTypes;

  if (!on.repositories) {
    next.topRepository = null;
    next.topRepositoryContributions = 0;
    next.activeRepositories = 0;
    next.repositoryDistribution = [];
    next.repositories.favoriteOfYear = null;
    next.repositories.activeWithCommitsThisYear = 0;
  }
  if (!on.languages) {
    next.languageCount = 0;
    next.topLanguage = null;
    next.topLanguagePercentage = 0;
    next.secondLanguage = null;
    next.secondLanguagePercentage = 0;
    next.languages.languageCount = 0;
    next.languages.topLanguage = null;
    next.languages.languages = [];
    next.languages.top10 = [];
  }
  if (!on.stars) {
    next.popularity.totalStars = 0;
    next.popularity.mostStarredRepository = null;
  }
  if (!on.followers) {
    next.social.followers = 0;
    next.community.followers = 0;
  }
  if (!on.following) {
    next.social.following = 0;
    next.community.following = 0;
  }
  if (!on.friends) {
    next.social.friends = 0;
    next.community.friends = 0;
  }
  if (!on.organizations) {
    next.profile.organizationsCount = 0;
    next.profile.organizationLogins = [];
    next.organizations.count = 0;
    next.organizations.logins = [];
    next.organizations.mostActive = null;
    next.organizations.activeThisYear = [];
  }
  if (!on.streak) {
    next.longestStreak = 0;
    next.currentStreak = 0;
    next.streakStartDate = null;
    next.streakEndDate = null;
    next.calendar.longestStreak = 0;
    next.calendar.currentStreak = 0;
  }
  if (!on.favoriteDay) {
    next.mostActiveDay = null;
    next.mostActiveDayCount = 0;
    next.mostActiveWeekday = null;
    next.calendar.mostActiveDay = null;
    next.calendar.mostActiveWeekday = null;
  }
  if (!on.favoriteMonth) {
    next.mostActiveMonth = null;
    next.mostActiveMonthCount = 0;
    next.calendar.mostActiveMonth = null;
  }
  if (!on.averageContributions) {
    next.averageDailyContributions = 0;
    next.activity.averageDailyContributions = 0;
  }
  if (!on.firstCommit) {
    next.firstActiveDay = null;
    next.calendar.firstActiveDay = null;
  }
  if (!on.lastCommit) {
    next.lastActiveDay = null;
    next.calendar.lastActiveDay = null;
  }

  next.generatedHighlights = next.generatedHighlights.filter((item) =>
    keepHighlight(item, on),
  );
  next.achievements = next.achievements.filter((item) =>
    keepAchievement(item, on),
  );

  return next;
}

export function requiredStatsForSlide(id: SlideId): StatId[] {
  switch (id) {
    case "contribution-types":
      return ["commits", "pullRequests", "issues", "codeReviews"];
    case "favorite-repo":
      return ["repositories"];
    case "heatmap":
      return ["contributions"];
    case "languages":
      return ["languages"];
    case "community":
      return ["followers", "following", "friends", "organizations", "stars"];
    case "streak":
      return ["streak"];
    default:
      return [];
  }
}

export function slideAllowedByStats(
  id: SlideId,
  stats: WrappedStatsToggles,
): boolean {
  const required = requiredStatsForSlide(id);
  if (required.length === 0) return true;
  return required.some((stat) => stats[stat]);
}
