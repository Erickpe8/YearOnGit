import type { Locale } from "@/lib/i18n/supported-locales";
import { formatWeekdayName } from "@/lib/wrapped/format";
import { findMostActiveWeekday } from "@/lib/wrapped/modules/calendar";
import type { WeekdayContribution } from "@/lib/wrapped/modules/types";
import { WEEKDAY_KEYS, WRAPPED_YEAR, type WeekdayKey } from "@/lib/wrapped/year";

export const DAYS_PER_WEEK = 7;

export type WeekdayInsight = {
  favoriteWeekday: WeekdayKey;
  favoriteWeekdayLabel: string;
  favoriteWeekdayContributions: number;
  /** @deprecated use favoriteWeekdayContributions */
  totalContributions: number;
  favoriteWeekdayIndex: number;
  /** @deprecated use favoriteWeekdayIndex */
  weekdayIndex: number;
};

export type PerfectWeeksInsight = {
  weekIndexes: number[];
  count: number;
};

export type ContributionAveragesInsight = {
  averagePerActiveDay: number;
  totalContributions: number;
  activeDays: number;
};

export type HeatmapStoryInsights = {
  weekday: WeekdayInsight | null;
  perfectWeeks: PerfectWeeksInsight;
  averages: ContributionAveragesInsight | null;
};

export function buildWeekdayInsights(
  weekdayContributions: WeekdayContribution[],
  locale: Locale = "en",
): WeekdayInsight | null {
  const favoriteWeekday = findMostActiveWeekday(weekdayContributions);
  if (!favoriteWeekday) return null;

  const entry = weekdayContributions.find(
    (item) => item.weekday === favoriteWeekday,
  );
  const favoriteWeekdayContributions = entry?.contributions ?? 0;
  if (favoriteWeekdayContributions <= 0) return null;

  const favoriteWeekdayIndex = WEEKDAY_KEYS.indexOf(favoriteWeekday);
  if (favoriteWeekdayIndex < 0) return null;

  const rawLabel = formatWeekdayName(favoriteWeekday, locale) ?? favoriteWeekday;
  const favoriteWeekdayLabel =
    rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  return {
    favoriteWeekday,
    favoriteWeekdayLabel,
    favoriteWeekdayContributions,
    totalContributions: favoriteWeekdayContributions,
    favoriteWeekdayIndex,
    weekdayIndex: favoriteWeekdayIndex,
  };
}

export function buildPerfectWeeks(
  levels: number[],
  dates?: string[],
): PerfectWeeksInsight {
  if (levels.length === 0) return { weekIndexes: [], count: 0 };

  const weekCount = Math.ceil(levels.length / DAYS_PER_WEEK);
  const weekIndexes: number[] = [];

  for (let week = 0; week < weekCount; week += 1) {
    let perfect = true;
    for (let day = 0; day < DAYS_PER_WEEK; day += 1) {
      const index = week * DAYS_PER_WEEK + day;
      if (index >= levels.length) {
        perfect = false;
        break;
      }
      const date = dates?.[index];
      if (date && !date.startsWith(String(WRAPPED_YEAR))) {
        perfect = false;
        break;
      }
      if ((levels[index] ?? 0) <= 0) {
        perfect = false;
        break;
      }
    }
    if (perfect) weekIndexes.push(week);
  }

  return { weekIndexes, count: weekIndexes.length };
}

export function buildContributionAverages(input: {
  totalContributions: number;
  activeDays: number;
}): ContributionAveragesInsight | null {
  const totalContributions = Math.max(0, input.totalContributions);
  const activeDays = Math.max(0, input.activeDays);
  if (totalContributions <= 0 || activeDays <= 0) return null;

  return {
    totalContributions,
    activeDays,
    averagePerActiveDay: Math.round((totalContributions / activeDays) * 10) / 10,
  };
}

export function buildHeatmapStoryInsights(
  input: {
    weekdayContributions: WeekdayContribution[];
    levels: number[];
    dates?: string[];
    totalContributions: number;
    activeDays: number;
  },
  locale: Locale = "en",
): HeatmapStoryInsights {
  return {
    weekday: buildWeekdayInsights(input.weekdayContributions, locale),
    perfectWeeks: buildPerfectWeeks(input.levels, input.dates),
    averages: buildContributionAverages({
      totalContributions: input.totalContributions,
      activeDays: input.activeDays,
    }),
  };
}

export const PEAK_DAY_RED = "#ff4d4d";
export const PEAK_MONTH_YELLOW = "#f5c518";
export const WEEKDAY_HIGHLIGHT_BLUE = "#5ba8f5";
export const PERFECT_WEEK_MAGENTA = "#c45b9f";

export const TYPE_MS_PER_CHAR = 28;
export const TYPE_LINE_PAUSE_MS = 360;
export const DAY_TEASER_BUDGET_MS = 3_600;
export const MONTH_TEASER_BUDGET_MS = 3_200;
export const WEEKDAY_TEASER_BUDGET_MS = 3_000;
export const WEEKS_TEASER_BUDGET_MS = 3_000;
export const PEAK_DAY_HOLD_MS = 2_200;
export const PEAK_MONTH_HOLD_MS = 2_200;
export const WEEKDAY_WAVE_STAGGER_MS = 22;
export const WEEKDAY_CELL_PULSE_MS = 360;
export const WEEKDAY_REVEAL_HOLD_MS = 2_200;
export const PERFECT_WEEK_STAGGER_MS = 80;
export const PERFECT_WEEK_HOLD_MS = 2_200;
export const MOSAIC_HOLD_MS = 2_000;
export const RESTORE_MS = 800;
export const SUMMARY_HOLD_MS = 2_600;
export const FINALE_HOLD_MS = 1_200;
export const STORY_INTRO_PAUSE_MS = 800;
export const POST_QUESTION_PAUSE_MS = 1_500;

/** @deprecated */
export const AVERAGE_HOLD_MS = SUMMARY_HOLD_MS;

export function typewriterDurationMs(lines: string[]): number {
  if (lines.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < lines.length; i += 1) {
    total += (lines[i]?.length ?? 0) * TYPE_MS_PER_CHAR;
    if (i < lines.length - 1) total += TYPE_LINE_PAUSE_MS;
  }
  return total + POST_QUESTION_PAUSE_MS;
}

export type HeatmapTeaserLines = {
  day?: string[];
  month?: string[];
  weekday?: string[];
  weeks?: string[];
};

export function heatmapStorySettleMs(
  insights: HeatmapStoryInsights & {
    hasPeakDay?: boolean;
    hasPeakMonth?: boolean;
  },
  weekCount: number,
  reducedMotion: boolean,
  teasers?: HeatmapTeaserLines,
): number {
  if (reducedMotion) return 1_400;

  let total = STORY_INTRO_PAUSE_MS;

  if (insights.hasPeakDay) {
    total +=
      (teasers?.day?.length
        ? typewriterDurationMs(teasers.day)
        : DAY_TEASER_BUDGET_MS) + PEAK_DAY_HOLD_MS;
  }
  if (insights.hasPeakMonth) {
    total +=
      (teasers?.month?.length
        ? typewriterDurationMs(teasers.month)
        : MONTH_TEASER_BUDGET_MS) + PEAK_MONTH_HOLD_MS;
  }

  if (insights.weekday) {
    total +=
      (teasers?.weekday?.length
        ? typewriterDurationMs(teasers.weekday)
        : WEEKDAY_TEASER_BUDGET_MS) +
      Math.max(0, weekCount - 1) * WEEKDAY_WAVE_STAGGER_MS +
      WEEKDAY_CELL_PULSE_MS +
      WEEKDAY_REVEAL_HOLD_MS;
  }

  if (insights.perfectWeeks.count > 0) {
    total +=
      (teasers?.weeks?.length
        ? typewriterDurationMs(teasers.weeks)
        : WEEKS_TEASER_BUDGET_MS) +
      insights.perfectWeeks.count * PERFECT_WEEK_STAGGER_MS +
      280 +
      PERFECT_WEEK_HOLD_MS;
  }

  total += MOSAIC_HOLD_MS + RESTORE_MS;

  if (insights.averages) total += SUMMARY_HOLD_MS;

  total += FINALE_HOLD_MS;
  return total;
}

/** @deprecated use heatmapStorySettleMs */
export function heatmapWeekdaySettleMs(
  insight: WeekdayInsight | null,
  weekCount: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion || !insight) return 0;
  return (
    STORY_INTRO_PAUSE_MS +
    Math.max(0, weekCount - 1) * WEEKDAY_WAVE_STAGGER_MS +
    WEEKDAY_CELL_PULSE_MS +
    WEEKDAY_REVEAL_HOLD_MS
  );
}

export const WEEKDAY_START_PAUSE_MS = STORY_INTRO_PAUSE_MS;
export const WEEKDAY_HINT_MS = 0;
export const WEEKDAY_REVEAL_LEAD_MS = 200;
export const WEEKDAY_CARD_HOLD_MS = WEEKDAY_REVEAL_HOLD_MS;
