import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateAchievements } from "@/lib/wrapped/modules/achievements";
import { generateHighlights } from "@/lib/wrapped/modules/highlights";
import { countRepositoriesCreatedThisYear } from "@/lib/wrapped/modules/compose";
import { createEmptyWrappedStats } from "@/lib/wrapped/build-stats";
import type { WrappedModules } from "@/lib/wrapped/modules/types";
import type { GitHubWrappedResponse } from "@/lib/wrapped/types";
import { WRAPPED_YEAR } from "@/lib/wrapped/year";

function modulesFromEmpty(): WrappedModules {
  const empty = createEmptyWrappedStats();
  return {
    profile: empty.profile,
    community: empty.community,
    activity: empty.activity,
    calendar: empty.calendar,
    habits: empty.habits,
    languages: empty.languages,
    repositories: empty.repositories,
    popularity: {
      totalStars: 0,
      totalForks: 0,
      totalWatchers: 0,
      averageStars: 0,
      totalsAreComplete: true,
      mostStarred: null,
      mostForked: null,
      mostWatched: null,
      mostPopular: null,
    },
    organizations: empty.organizations,
    collaboration: empty.collaboration,
    technologies: empty.technologies,
    curiosities: empty.curiosities,
    achievements: [],
    generatedHighlights: [],
  };
}

describe("achievements and highlights", () => {
  it("unlocks objective achievements from thresholds", () => {
    const modules = modulesFromEmpty();
    modules.activity.totalCommits = 500;
    modules.calendar.longestStreak = 14;
    modules.languages.languageCount = 5;
    modules.community.friends = 10;

    const achievements = calculateAchievements(modules);
    const unlocked = new Set(
      achievements.filter((item) => item.unlocked).map((item) => item.id),
    );

    assert.equal(unlocked.has("commit_machine"), true);
    assert.equal(unlocked.has("streak_master"), true);
    assert.equal(unlocked.has("polyglot"), true);
    assert.equal(unlocked.has("community_builder"), true);
    assert.equal(achievements.length, 8);

    const commits = achievements.find((item) => item.id === "commit_machine");
    assert.equal(commits?.tier, "silver");
    assert.equal(commits?.nextTier, "gold");
    assert.equal(commits?.threshold, 1000);
    assert.deepEqual(commits?.tiers, {
      bronze: true,
      silver: true,
      gold: false,
    });

    const streak = achievements.find((item) => item.id === "streak_master");
    assert.equal(streak?.tier, "silver");
  });

  it("floors star collector by most-starred repo", () => {
    const modules = modulesFromEmpty();
    modules.popularity.totalStars = 3;
    modules.popularity.mostStarred = {
      nameWithOwner: "user/repo",
      value: 18,
    };
    const achievements = calculateAchievements(modules);
    const stars = achievements.find((item) => item.id === "star_collector");
    assert.equal(stars?.value, 18);
    assert.equal(stars?.tier, "bronze");
  });

  it("counts repo creator excluding forks", () => {
    const collection = {
      totalRepositoryContributions: 9,
      repositoryContributions: {
        totalCount: 4,
        nodes: [
          {
            repository: {
              nameWithOwner: "u/a",
              isFork: false,
              createdAt: `${WRAPPED_YEAR}-01-01T00:00:00Z`,
            },
          },
          {
            repository: {
              nameWithOwner: "u/b",
              isFork: true,
              createdAt: `${WRAPPED_YEAR}-02-01T00:00:00Z`,
            },
          },
          {
            repository: {
              nameWithOwner: "u/c",
              isFork: false,
              createdAt: `${WRAPPED_YEAR}-03-01T00:00:00Z`,
            },
          },
          {
            repository: {
              nameWithOwner: "u/d",
              isFork: false,
              createdAt: `${WRAPPED_YEAR}-04-01T00:00:00Z`,
            },
          },
        ],
      },
    } as NonNullable<
      NonNullable<GitHubWrappedResponse["viewer"]>["contributionsCollection"]
    >;

    assert.equal(countRepositoriesCreatedThisYear(collection), 3);
  });

  it("keeps bronze below mid thresholds", () => {
    const modules = modulesFromEmpty();
    modules.activity.totalCommits = 120;
    const achievements = calculateAchievements(modules);
    const commits = achievements.find((item) => item.id === "commit_machine");
    assert.equal(commits?.tier, "bronze");
    assert.equal(commits?.nextTier, "silver");
    assert.equal(commits?.threshold, 500);
  });

  it("ranks highlights by score", () => {
    const modules = modulesFromEmpty();
    modules.calendar.mostActiveMonth = 10;
    modules.calendar.mostActiveMonthCount = 120;
    modules.community.friends = 42;
    modules.activity.activityRate = 78;

    const highlights = generateHighlights(modules);
    assert.ok(highlights.length >= 2);
    assert.ok(highlights[0].score >= highlights[1].score);
  });
});
