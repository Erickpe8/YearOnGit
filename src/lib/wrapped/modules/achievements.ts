import {
  ACHIEVEMENT_CATALOG,
  resolveAchievementTier,
  resolveNextTier,
  tierThreshold,
  type AchievementMetric,
  type CatalogAchievementId,
} from "@/lib/wrapped/achievements-catalog";
import type {
  Achievement,
  AchievementId,
  WrappedModules,
} from "@/lib/wrapped/modules/types";

const METRIC_RESOLVERS: Record<
  AchievementMetric,
  (modules: WrappedModules) => number
> = {
  totalCommits: (m) => m.activity.totalCommits,
  longestStreak: (m) => m.calendar.longestStreak,
  languageCount: (m) => m.languages.languageCount,
  publicSharePct: (m) => m.repositories.repositoryBreakdown.publicSharePct,
  reposCreatedThisYear: (m) => m.activity.repositoriesCreatedThisYear,
  friends: (m) => m.community.friends,
  weekendActivityPercentage: (m) => m.habits.weekendActivityPercentage,
  totalStars: (m) =>
    Math.max(m.popularity.totalStars, m.popularity.mostStarred?.value ?? 0),
};

export function calculateAchievements(modules: WrappedModules): Achievement[] {
  return ACHIEVEMENT_CATALOG.map((entry) => {
    const value = METRIC_RESOLVERS[entry.metric](modules);
    const tier = resolveAchievementTier(value, entry.tiers);
    const nextTier = resolveNextTier(tier);
    const threshold = nextTier
      ? tierThreshold(entry.tiers, nextTier)
      : entry.tiers.gold;

    return {
      id: entry.id as AchievementId,
      value,
      unlocked: tier !== null,
      tier,
      nextTier,
      threshold,
      tiers: {
        bronze: value >= entry.tiers.bronze,
        silver: value >= entry.tiers.silver,
        gold: value >= entry.tiers.gold,
      },
    };
  });
}

export function isAchievementId(id: string): id is CatalogAchievementId {
  return ACHIEVEMENT_CATALOG.some((entry) => entry.id === id);
}
