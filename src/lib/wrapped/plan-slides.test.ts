import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmptyWrappedStats } from "@/lib/wrapped/build-stats";
import { planWrappedSlides } from "@/lib/wrapped/plan-slides";

describe("planWrappedSlides", () => {
  it("always includes overview, heatmap, streak and summary", () => {
    const stats = createEmptyWrappedStats();
    const kinds = planWrappedSlides(stats).map((slide) => slide.kind);
    assert.deepEqual(
      kinds.filter((kind) =>
        ["overview", "heatmap", "streak", "summary"].includes(kind),
      ),
      ["overview", "heatmap", "streak", "summary"],
    );
    assert.equal(kinds.includes("achievements"), false);
    assert.equal(kinds.includes("highlight"), false);
  });

  it("inserts highlights and achievements from real data", () => {
    const stats = createEmptyWrappedStats();
    stats.contributionTypes = [
      { type: "commits", count: 10, shareOfTypedActivity: 100 },
      { type: "pullRequests", count: 0, shareOfTypedActivity: 0 },
      { type: "issues", count: 0, shareOfTypedActivity: 0 },
      { type: "codeReviews", count: 0, shareOfTypedActivity: 0 },
    ];
    stats.languageCount = 2;
    stats.social.followers = 5;
    stats.generatedHighlights = [
      {
        id: "best_month",
        score: 100,
        templateKey: "highlightBestMonth",
        values: { month: 10, count: 50 },
      },
      {
        id: "friends",
        score: 90,
        templateKey: "highlightFriends",
        values: { count: 12 },
      },
      {
        id: "streak",
        score: 80,
        templateKey: "highlightStreak",
        values: { days: 14 },
      },
    ];
    stats.achievements = [
      {
        id: "streak_master",
        unlocked: true,
        tier: "silver",
        nextTier: "gold",
        threshold: 30,
        value: 14,
        tiers: { bronze: true, silver: true, gold: false },
      },
      {
        id: "polyglot",
        unlocked: false,
        tier: null,
        nextTier: "bronze",
        threshold: 3,
        value: 2,
        tiers: { bronze: false, silver: false, gold: false },
      },
    ];

    const slides = planWrappedSlides(stats);
    const kinds = slides.map((slide) => slide.kind);

    assert.equal(kinds.includes("contribution-types"), true);
    assert.equal(kinds.includes("languages"), true);
    assert.equal(kinds.includes("community"), true);
    assert.equal(kinds.includes("achievements"), true);
    assert.equal(kinds.filter((kind) => kind === "highlight").length, 3);

    const achievementsSlide = slides.find((slide) => slide.kind === "achievements");
    assert.ok(achievementsSlide?.kind === "achievements");
    assert.equal(achievementsSlide.achievements.length, 2);
    assert.equal(
      achievementsSlide.achievements.some((item) => item.id === "streak_master"),
      true,
    );
  });
});
