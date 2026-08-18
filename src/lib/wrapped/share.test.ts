import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReadmeMarkdown,
  buildShareCardUrl,
  buildShareMetaDescription,
  buildShareMetaTitle,
  buildShareUrl,
  generateShareSlug,
  isValidShareSlug,
  isWrappedStats,
  toPublicSharePayload,
} from "@/lib/wrapped/share";
import { createEmptyWrappedStats } from "@/lib/wrapped/build-stats";

describe("share helpers", () => {
  it("generates stable 8-char hex slugs", () => {
    const slug = generateShareSlug();
    assert.equal(isValidShareSlug(slug), true);
    assert.equal(slug.length, 8);
  });

  it("rejects invalid slugs", () => {
    assert.equal(isValidShareSlug("short"), false);
    assert.equal(isValidShareSlug("zzzzzzzz"), false);
    assert.equal(isValidShareSlug("8f4b9b2e"), true);
  });

  it("builds public share URLs", () => {
    assert.equal(
      buildShareUrl("8f4b9b2e", "https://yearongit.com"),
      "https://yearongit.com/share/8f4b9b2e",
    );
  });

  it("builds README markdown with card image and share link", () => {
    assert.equal(
      buildShareCardUrl("8f4b9b2e", "https://yearongit.com"),
      "https://yearongit.com/share/8f4b9b2e/card",
    );
    assert.equal(
      buildReadmeMarkdown({
        slug: "8f4b9b2e",
        username: "erick",
        year: 2026,
        baseUrl: "https://yearongit.com",
      }),
      "[![@erick's Year on Git 2026](https://yearongit.com/cards/erick/2026.png?lang=en)](https://yearongit.com/share/8f4b9b2e)",
    );
  });

  it("creates a public payload without sensitive fields", () => {
    const stats = createEmptyWrappedStats();
    const payload = toPublicSharePayload({
      stats,
      username: "@octocat",
      year: 2026,
    });

    assert.equal(payload.username, "octocat");
    assert.equal(payload.year, 2026);
    assert.equal(isWrappedStats(payload.stats), true);
    assert.equal("access_token" in payload, false);
  });

  it("builds social metadata from real stats", () => {
    const stats = createEmptyWrappedStats();
    stats.totalContributions = 2113;
    stats.totalCommits = 2036;
    stats.longestStreak = 31;
    stats.languageCount = 5;

    const payload = toPublicSharePayload({
      stats,
      username: "erick",
      year: 2026,
    });

    assert.equal(buildShareMetaTitle(payload), "@erick's Year on Git 2026");
    assert.match(
      buildShareMetaDescription(payload),
      /2113 contributions · 2036 commits · 31-day streak · 5 languages/,
    );
  });
});
