import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyAdminStats,
  DEFAULT_WRAPPED_CONFIG,
  mergeWrappedConfig,
  slideAllowedByStats,
  wrappedQueryWindow,
} from "@/lib/admin/wrapped-config";
import { createEmptyWrappedStats } from "@/lib/wrapped/build-stats";
import { planWrappedSlides } from "@/lib/wrapped/plan-slides";

describe("wrapped admin config", () => {
  it("keeps wrappedEnabled false instead of defaulting it back on", () => {
    assert.equal(mergeWrappedConfig({ wrappedEnabled: false }).wrappedEnabled, false);
    assert.equal(
      mergeWrappedConfig(JSON.stringify({ wrappedEnabled: false })).wrappedEnabled,
      false,
    );
  });

  it("fills missing slides and keeps custom order", () => {
    const merged = mergeWrappedConfig({
      wrappedYear: 2025,
      slides: [{ id: "summary", enabled: false }, { id: "overview", enabled: true }],
      features: { music: false },
      stats: { commits: false },
    });

    assert.equal(merged.wrappedYear, 2025);
    assert.equal(merged.slides[0]?.id, "summary");
    assert.equal(merged.slides[0]?.enabled, false);
    assert.equal(merged.slides.some((slide) => slide.id === "heatmap"), true);
    assert.equal(merged.features.music, false);
    assert.equal(merged.features.autoplay, true);
    assert.equal(merged.stats.commits, false);
    assert.equal(merged.stats.languages, true);
  });

  it("builds a GitHub query window from the configured period", () => {
    const window = wrappedQueryWindow({
      ...DEFAULT_WRAPPED_CONFIG,
      wrappedYear: 2026,
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
    });
    assert.equal(window.from, "2026-01-01T00:00:00.000Z");
    assert.equal(window.to, "2026-12-31T23:59:59.999Z");
    assert.equal(window.daysInYear, 365);
  });

  it("hides disabled slides and skips slides whose stats are off", () => {
    const stats = createEmptyWrappedStats();
    stats.languageCount = 2;
    stats.contributionTypes = [
      { type: "commits", count: 10, shareOfTypedActivity: 100 },
      { type: "pullRequests", count: 0, shareOfTypedActivity: 0 },
      { type: "issues", count: 0, shareOfTypedActivity: 0 },
      { type: "codeReviews", count: 0, shareOfTypedActivity: 0 },
    ];

    const config = mergeWrappedConfig({
      slides: [
        { id: "overview", enabled: true },
        { id: "contribution-types", enabled: false },
        { id: "languages", enabled: true },
        { id: "heatmap", enabled: true },
        { id: "streak", enabled: true },
        { id: "summary", enabled: true },
      ],
      stats: { languages: false },
    });

    const kinds = planWrappedSlides(stats, { config }).map((slide) => slide.kind);
    assert.equal(kinds.includes("contribution-types"), false);
    assert.equal(kinds.includes("languages"), false);
    assert.equal(kinds.includes("overview"), true);
    assert.equal(slideAllowedByStats("languages", config.stats), false);

    const allKinds = planWrappedSlides(stats, {
      config,
      includeDisabled: true,
    }).map((slide) => slide.kind);
    assert.equal(allKinds.includes("contribution-types"), true);
  });

  it("masks disabled stats so slides do not receive empty visuals", () => {
    const stats = createEmptyWrappedStats();
    stats.totalCommits = 42;
    stats.generatedHighlights = [
      {
        id: "favorite_repo",
        score: 80,
        templateKey: "highlightFavoriteRepo",
        values: { repo: "acme/app", count: 12 },
      },
    ];
    const masked = applyAdminStats(stats, {
      ...DEFAULT_WRAPPED_CONFIG,
      stats: { ...DEFAULT_WRAPPED_CONFIG.stats, commits: false, repositories: false },
    });
    assert.equal(masked.totalCommits, 0);
    assert.equal(masked.generatedHighlights.length, 0);
  });
});
