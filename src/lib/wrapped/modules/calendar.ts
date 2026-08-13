import {
  isWeekendDay,
  WEEKDAY_KEYS,
  WRAPPED_DAYS_IN_YEAR,
  WRAPPED_YEAR,
  type WeekdayKey,
} from "@/lib/wrapped/year";
import type {
  CalendarModule,
  HabitsModule,
  MonthlyContribution,
  WeekdayContribution,
} from "@/lib/wrapped/modules/types";
import type { GitHubContributionDay } from "@/lib/wrapped/types";

export function flattenContributionDays(
  weeks: Array<{ contributionDays: GitHubContributionDay[] }> | undefined,
): GitHubContributionDay[] {
  if (!weeks) return [];
  return weeks.flatMap((week) => week.contributionDays);
}

export function filterYearDays(days: GitHubContributionDay[]): GitHubContributionDay[] {
  return days.filter((day) => day.date.startsWith(String(WRAPPED_YEAR)));
}

export function calculateActiveDays(days: GitHubContributionDay[]): number {
  return days.filter((day) => day.contributionCount > 0).length;
}

export function calculateActivityRate(activeDays: number): number {
  return Math.round((activeDays / WRAPPED_DAYS_IN_YEAR) * 1000) / 10;
}

export function calculateAverageDailyContributions(
  total: number,
  activeDays: number,
): number {
  if (activeDays === 0) return 0;
  return Math.round((total / activeDays) * 10) / 10;
}

export function findMostActiveDay(days: GitHubContributionDay[]): {
  date: string | null;
  count: number;
} {
  let best: GitHubContributionDay | null = null;
  for (const day of days) {
    if (!best || day.contributionCount > best.contributionCount) {
      best = day;
    }
  }
  return { date: best?.date ?? null, count: best?.contributionCount ?? 0 };
}

export function findLeastActiveAmongActive(days: GitHubContributionDay[]): {
  date: string | null;
  count: number;
} {
  const active = days.filter((day) => day.contributionCount > 0);
  if (active.length === 0) return { date: null, count: 0 };
  let least = active[0];
  for (const day of active) {
    if (day.contributionCount < least.contributionCount) least = day;
  }
  return { date: least.date, count: least.contributionCount };
}

export function findFirstAndLastActiveDays(
  days: GitHubContributionDay[],
): { firstActiveDay: string | null; lastActiveDay: string | null } {
  const active = days
    .filter((day) => day.contributionCount > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    firstActiveDay: active[0]?.date ?? null,
    lastActiveDay: active[active.length - 1]?.date ?? null,
  };
}

export function calculateStreaks(days: GitHubContributionDay[]): {
  longestStreak: number;
  currentStreak: number;
  streakStartDate: string | null;
  streakEndDate: string | null;
} {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;
  let run = 0;
  let runStart: string | null = null;

  for (const day of sorted) {
    if (day.contributionCount > 0) {
      if (run === 0) runStart = day.date;
      run += 1;
      if (run > longest) {
        longest = run;
        longestStart = runStart;
        longestEnd = day.date;
      }
    } else {
      run = 0;
      runStart = null;
    }
  }

  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].contributionCount > 0) current += 1;
    else break;
  }

  return {
    longestStreak: longest,
    currentStreak: current,
    streakStartDate: longestStart,
    streakEndDate: longestEnd,
  };
}

export function findLongestBreak(days: GitHubContributionDay[]): {
  days: number;
  start: string | null;
  end: string | null;
} {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let bestStart: string | null = null;
  let bestEnd: string | null = null;
  let run = 0;
  let runStart: string | null = null;

  for (const day of sorted) {
    if (day.contributionCount === 0) {
      if (run === 0) runStart = day.date;
      run += 1;
      if (run > best) {
        best = run;
        bestStart = runStart;
        bestEnd = day.date;
      }
    } else {
      run = 0;
      runStart = null;
    }
  }

  return { days: best, start: bestStart, end: bestEnd };
}

export function buildMonthlyContributions(
  days: GitHubContributionDay[],
): MonthlyContribution[] {
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    contributions: 0,
  }));
  for (const day of days) {
    const month = Number(day.date.slice(5, 7));
    if (month >= 1 && month <= 12) {
      months[month - 1].contributions += day.contributionCount;
    }
  }
  return months;
}

export function findMostActiveMonth(months: MonthlyContribution[]): {
  month: number | null;
  count: number;
} {
  let best = months[0];
  for (const entry of months) {
    if (entry.contributions > best.contributions) best = entry;
  }
  if (!best || best.contributions === 0) return { month: null, count: 0 };
  return { month: best.month, count: best.contributions };
}

export function buildWeekdayContributions(
  days: GitHubContributionDay[],
): WeekdayContribution[] {
  const totals = Object.fromEntries(
    WEEKDAY_KEYS.map((key) => [key, 0]),
  ) as Record<WeekdayKey, number>;

  for (const day of days) {
    const key = WEEKDAY_KEYS[new Date(`${day.date}T12:00:00Z`).getUTCDay()];
    totals[key] += day.contributionCount;
  }

  return WEEKDAY_KEYS.map((weekday) => ({
    weekday,
    contributions: totals[weekday],
  }));
}

export function findMostActiveWeekday(
  entries: WeekdayContribution[],
): WeekdayKey | null {
  let best: WeekdayContribution | null = null;
  for (const entry of entries) {
    if (!best || entry.contributions > best.contributions) best = entry;
  }
  if (!best || best.contributions === 0) return null;
  return best.weekday;
}

export function calculateWeekendActivity(days: GitHubContributionDay[]): {
  weekendContributions: number;
  weekdayContributionsTotal: number;
  weekendActivityPercentage: number;
  weekdayActivityPercentage: number;
} {
  let weekend = 0;
  let weekday = 0;
  for (const day of days) {
    const dayIndex = new Date(`${day.date}T12:00:00Z`).getUTCDay();
    if (isWeekendDay(dayIndex)) weekend += day.contributionCount;
    else weekday += day.contributionCount;
  }
  const total = weekend + weekday;
  const weekendPct =
    total === 0 ? 0 : Math.round((weekend / total) * 1000) / 10;
  return {
    weekendContributions: weekend,
    weekdayContributionsTotal: weekday,
    weekendActivityPercentage: weekendPct,
    weekdayActivityPercentage:
      total === 0 ? 0 : Math.round((100 - weekendPct) * 10) / 10,
  };
}

export function findMostActiveWeek(days: GitHubContributionDay[]): {
  start: string | null;
  count: number;
} {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const byWeek = new Map<string, number>();

  for (const day of sorted) {
    const date = new Date(`${day.date}T12:00:00Z`);
    const dayOfWeek = date.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + mondayOffset);
    const key = monday.toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) ?? 0) + day.contributionCount);
  }

  let bestStart: string | null = null;
  let bestCount = 0;
  for (const [start, count] of byWeek) {
    if (count > bestCount) {
      bestStart = start;
      bestCount = count;
    }
  }
  return { start: bestStart, count: bestCount };
}

export function contributionCountToHeatmapLevel(
  count: number,
  max: number,
): number {
  if (count <= 0) return 0;
  if (max <= 0) return 1;
  const ratio = count / max;
  if (ratio <= 0.33) return 1;
  if (ratio <= 0.66) return 2;
  return 3;
}

export function buildHeatmap(days: GitHubContributionDay[]): number[] {
  const yearDays = filterYearDays(days);
  const max = yearDays.reduce(
    (peak, day) => Math.max(peak, day.contributionCount),
    0,
  );
  return days.map((day) => {
    if (!day.date.startsWith(String(WRAPPED_YEAR))) return 0;
    return contributionCountToHeatmapLevel(day.contributionCount, max);
  });
}

export function findHeatmapPeakIndex(
  days: GitHubContributionDay[],
  peakDate: string | null,
): number | null {
  if (!peakDate) return null;
  const index = days.findIndex((day) => day.date === peakDate);
  return index >= 0 ? index : null;
}

export function buildCalendarModule(
  yearDays: GitHubContributionDay[],
  allDaysForHeatmap: GitHubContributionDay[],
): CalendarModule {
  const streaks = calculateStreaks(yearDays);
  const mostActiveDay = findMostActiveDay(yearDays);
  const least = findLeastActiveAmongActive(yearDays);
  const monthly = buildMonthlyContributions(yearDays);
  const mostMonth = findMostActiveMonth(monthly);
  const week = findMostActiveWeek(yearDays);
  const brk = findLongestBreak(yearDays);
  const { firstActiveDay, lastActiveDay } = findFirstAndLastActiveDays(yearDays);
  const weekdayContributions = buildWeekdayContributions(yearDays);
  const heatmap = buildHeatmap(allDaysForHeatmap);
  const heatmapDates = allDaysForHeatmap.map((day) => day.date);

  return {
    heatmap,
    heatmapDates,
    heatmapPeakIndex: findHeatmapPeakIndex(
      allDaysForHeatmap,
      mostActiveDay.date,
    ),
    longestStreak: streaks.longestStreak,
    currentStreak: streaks.currentStreak,
    streakStartDate: streaks.streakStartDate,
    streakEndDate: streaks.streakEndDate,
    mostActiveDay: mostActiveDay.date,
    mostActiveDayCount: mostActiveDay.count,
    leastActiveDayAmongActive: least.date,
    leastActiveDayCount: least.count,
    mostActiveMonth: mostMonth.month,
    mostActiveMonthCount: mostMonth.count,
    monthlyContributions: monthly,
    mostActiveWeekStart: week.start,
    mostActiveWeekCount: week.count,
    longestBreakDays: brk.days,
    longestBreakStart: brk.start,
    longestBreakEnd: brk.end,
    firstActiveDay,
    lastActiveDay,
    mostActiveWeekday: findMostActiveWeekday(weekdayContributions),
    weekdayContributions,
  };
}

export function buildHabitsModule(yearDays: GitHubContributionDay[]): HabitsModule {
  const weekend = calculateWeekendActivity(yearDays);
  return {
    ...weekend,
    hourOfDayUnsupported: true,
  };
}
