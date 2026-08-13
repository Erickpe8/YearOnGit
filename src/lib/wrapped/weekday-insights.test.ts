import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWeekdayInsights } from "@/lib/wrapped/weekday-insights";
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

describe("buildWeekdayInsights (compat)", () => {
  it("still exports from weekday-insights barrel", () => {
    const insight = buildWeekdayInsights(
      entries({ sunday: 400, monday: 120 }),
      "en",
    );
    assert.ok(insight);
    assert.equal(insight.favoriteWeekday, "sunday");
    assert.equal(insight.weekdayIndex, 0);
  });
});
