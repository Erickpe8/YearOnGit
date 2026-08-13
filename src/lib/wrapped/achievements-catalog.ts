export type AchievementMetric =
  | "totalCommits"
  | "longestStreak"
  | "languageCount"
  | "publicSharePct"
  | "reposCreatedThisYear"
  | "friends"
  | "weekendActivityPercentage"
  | "totalStars";

export type AchievementIconName =
  | "git-commit"
  | "flame"
  | "language"
  | "heart-handshake"
  | "folder-plus"
  | "users"
  | "calendar-event"
  | "star";

export type AchievementTier = "bronze" | "silver" | "gold";

export type AchievementTierThresholds = {
  bronze: number;
  silver: number;
  gold: number;
};

export const PODIUM_COLORS: Record<AchievementTier, string> = {
  bronze: "#c08a5c",
  silver: "#b8c0cc",
  gold: "#f5c518",
};

export type AchievementCatalogEntry = {
  id: string;
  name: string;
  description: string;
  icon: AchievementIconName;
  tiers: AchievementTierThresholds;
  unlockGuide: string;
  metric: AchievementMetric;
};

export const ACHIEVEMENT_CATALOG = [
  {
    id: "commit_machine",
    name: "Commit Machine",
    description: "Total commits made during the year",
    icon: "git-commit",
    tiers: { bronze: 100, silver: 500, gold: 1000 },
    unlockGuide: "Keep committing — every commit counts",
    metric: "totalCommits",
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Longest consecutive days with activity",
    icon: "flame",
    tiers: { bronze: 7, silver: 14, gold: 30 },
    unlockGuide: "Maintain a daily streak — aim for longer runs",
    metric: "longestStreak",
  },
  {
    id: "polyglot",
    name: "Polyglot",
    description: "Distinct programming languages used across your repos",
    icon: "language",
    tiers: { bronze: 3, silver: 5, gold: 8 },
    unlockGuide: "Work across more programming languages",
    metric: "languageCount",
  },
  {
    id: "open_source_hero",
    name: "Open Source Hero",
    description: "Share of commit repos that are public",
    icon: "heart-handshake",
    tiers: { bronze: 30, silver: 60, gold: 80 },
    unlockGuide: "Make more of your active repos public",
    metric: "publicSharePct",
  },
  {
    id: "repo_creator",
    name: "Repo Creator",
    description: "Original repositories you created this year (excluding forks)",
    icon: "folder-plus",
    tiers: { bronze: 1, silver: 3, gold: 5 },
    unlockGuide: "Create more original repositories this year",
    metric: "reposCreatedThisYear",
  },
  {
    id: "community_builder",
    name: "Community Builder",
    description: "Mutual follows (GitHub friends)",
    icon: "users",
    tiers: { bronze: 5, silver: 10, gold: 25 },
    unlockGuide: "Connect with more people on GitHub",
    metric: "friends",
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Share of contributions happening on weekends",
    icon: "calendar-event",
    tiers: { bronze: 10, silver: 15, gold: 25 },
    unlockGuide: "Stay active on weekends too",
    metric: "weekendActivityPercentage",
  },
  {
    id: "star_collector",
    name: "Star Collector",
    description: "Total stars received across your repositories",
    icon: "star",
    tiers: { bronze: 10, silver: 50, gold: 100 },
    unlockGuide: "Earn more stars on your repositories",
    metric: "totalStars",
  },
] as const satisfies readonly AchievementCatalogEntry[];

export type CatalogAchievementId = (typeof ACHIEVEMENT_CATALOG)[number]["id"];

export const TIER_ORDER: AchievementTier[] = ["bronze", "silver", "gold"];

export function getAchievementDefinition(
  id: string,
): AchievementCatalogEntry | undefined {
  return ACHIEVEMENT_CATALOG.find((entry) => entry.id === id);
}

export function resolveAchievementTier(
  value: number,
  tiers: AchievementTierThresholds,
): AchievementTier | null {
  if (value >= tiers.gold) return "gold";
  if (value >= tiers.silver) return "silver";
  if (value >= tiers.bronze) return "bronze";
  return null;
}

export function resolveNextTier(
  tier: AchievementTier | null,
): AchievementTier | null {
  if (tier === null) return "bronze";
  if (tier === "bronze") return "silver";
  if (tier === "silver") return "gold";
  return null;
}

export function tierThreshold(
  tiers: AchievementTierThresholds,
  tier: AchievementTier,
): number {
  return tiers[tier];
}

export function tierRank(tier: AchievementTier | null): number {
  if (tier === "gold") return 3;
  if (tier === "silver") return 2;
  if (tier === "bronze") return 1;
  return 0;
}
