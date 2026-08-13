import type { Locale } from "@/lib/i18n/supported-locales";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { AchievementId, Highlight } from "@/lib/wrapped/modules/types";
import { formatMonthName, formatNumber } from "@/lib/wrapped/format";

export const HIGHLIGHT_TEMPLATE_KEYS = [
  "highlightBestMonth",
  "highlightActivityRate",
  "highlightPrivateShare",
  "highlightOrgsActive",
  "highlightMostStarred",
  "highlightFriends",
  "highlightStreak",
  "highlightTopLanguage",
  "highlightFavoriteRepo",
] as const satisfies readonly TranslationKey[];

export type HighlightTemplateKey = (typeof HIGHLIGHT_TEMPLATE_KEYS)[number];

const HIGHLIGHT_KEY_SET = new Set<string>(HIGHLIGHT_TEMPLATE_KEYS);

export function isHighlightTemplateKey(key: string): key is HighlightTemplateKey {
  return HIGHLIGHT_KEY_SET.has(key);
}

export function resolveHighlightValues(
  highlight: Highlight,
  locale: Locale,
): Record<string, string | number> {
  const values: Record<string, string | number> = { ...highlight.values };

  if (typeof values.month === "number") {
    values.month = formatMonthName(values.month, locale) ?? String(values.month);
  }

  for (const key of ["count", "percent", "stars", "days"] as const) {
    if (typeof values[key] === "number") {
      values[key] = formatNumber(values[key] as number, locale);
    }
  }

  return values;
}

export const ACHIEVEMENT_TITLE_KEYS = {
  commit_machine: "achievementCommitMachine",
  streak_master: "achievementStreakMaster",
  weekend_warrior: "achievementWeekendWarrior",
  polyglot: "achievementPolyglot",
  open_source_hero: "achievementOpenSourceHero",
  repo_creator: "achievementRepoCreator",
  community_builder: "achievementCommunityBuilder",
  star_collector: "achievementStarCollector",
} as const satisfies Record<AchievementId, TranslationKey>;

export const ACHIEVEMENT_DESC_KEYS = {
  commit_machine: "achievementCommitMachineDesc",
  streak_master: "achievementStreakMasterDesc",
  weekend_warrior: "achievementWeekendWarriorDesc",
  polyglot: "achievementPolyglotDesc",
  open_source_hero: "achievementOpenSourceHeroDesc",
  repo_creator: "achievementRepoCreatorDesc",
  community_builder: "achievementCommunityBuilderDesc",
  star_collector: "achievementStarCollectorDesc",
} as const satisfies Record<AchievementId, TranslationKey>;

export const ACHIEVEMENT_UNLOCK_KEYS = {
  commit_machine: "achievementCommitMachineUnlock",
  streak_master: "achievementStreakMasterUnlock",
  weekend_warrior: "achievementWeekendWarriorUnlock",
  polyglot: "achievementPolyglotUnlock",
  open_source_hero: "achievementOpenSourceHeroUnlock",
  repo_creator: "achievementRepoCreatorUnlock",
  community_builder: "achievementCommunityBuilderUnlock",
  star_collector: "achievementStarCollectorUnlock",
} as const satisfies Record<AchievementId, TranslationKey>;
