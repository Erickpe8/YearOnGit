import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildContributionAverages,
  buildPerfectWeeks,
  buildWeekdayInsights,
} from "@/lib/wrapped/heatmap-story";
import type { WeekdayContribution } from "@/lib/wrapped/modules/types";
import type { WeekdayKey } from "@/lib/wrapped/year";

function entries(
  totals: Partial<Record<WeekdayKey, number>>,
): WeekdayContribution[] {
  const keys: WeekdayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return keys.map((weekday) => ({
    weekday,
    contributions: totals[weekday] ?? 0,
  }));
}

describe("buildWeekdayInsights", () => {
  it("returns null when every weekday is empty", () => {
    assert.equal(buildWeekdayInsights(entries({})), null);
  });

  it("picks the weekday with the highest contribution sum", () => {
    const insight = buildWeekdayInsights(
      entries({
        sunday: 245,
        monday: 189,
        tuesday: 321,
        wednesday: 280,
        thursday: 240,
        friday: 160,
        saturday: 75,
      }),
      "es",
    );
    assert.ok(insight);
    assert.equal(insight.favoriteWeekday, "tuesday");
    assert.equal(insight.favoriteWeekdayIndex, 2);
    assert.equal(insight.favoriteWeekdayContributions, 321);
    assert.equal(insight.favoriteWeekdayLabel, "Martes");
  });
});

describe("buildPerfectWeeks", () => {
  it("finds columns where every day has activity", () => {
    // 2 weeks: first perfect (all level≥1), second has a zero on Wednesday
    const levels = [
      1, 1, 1, 1, 1, 1, 1, // week 0
      1, 1, 1, 0, 1, 1, 1, // week 1
    ];
    const dates = Array.from({ length: 14 }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return `2026-01-${day}`;
    });
    const result = buildPerfectWeeks(levels, dates);
    assert.deepEqual(result.weekIndexes, [0]);
    assert.equal(result.count, 1);
  });

  it("rejects weeks with out-of-year padding days", () => {
    const levels = [1, 1, 1, 1, 1, 1, 1];
    const dates = [
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ];
    assert.equal(buildPerfectWeeks(levels, dates).count, 0);
  });
});

describe("buildContributionAverages", () => {
  it("divides total contributions by active days", () => {
    const result = buildContributionAverages({
      totalContributions: 2113,
      activeDays: 145,
    });
    assert.ok(result);
    assert.equal(result.averagePerActiveDay, 14.6);
  });

  it("returns null without active days", () => {
    assert.equal(
      buildContributionAverages({ totalContributions: 10, activeDays: 0 }),
      null,
    );
  });
});
