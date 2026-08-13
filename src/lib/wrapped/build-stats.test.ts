import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateLanguages,
  buildContributionTypes,
  buildHeatmap,
  buildMonthlyContributions,
  buildRepositoryDistribution,
  buildWeekdayContributions,
  buildWrappedStats,
  calculateActiveDays,
  calculateActivityRate,
  calculateAverageDailyContributions,
  calculateStreaks,
  calculateWeekendActivity,
  classifyRepositoryBreakdown,
  createEmptyWrappedStats,
  filterYearDays,
  findMostActiveDay,
  findMostActiveMonth,
  findMostActiveWeekday,
  resolveActiveRepositories,
  resolveTotalCommits,
  sumCommits,
} from "@/lib/wrapped/build-stats";
import type {
  GitHubCommitRepoEntry,
  GitHubContributionDay,
  GitHubWrappedResponse,
} from "@/lib/wrapped/types";
import { REPOSITORY_QUERY_LIMIT } from "@/lib/wrapped/data-sources";
import { WRAPPED_DAYS_IN_YEAR, WRAPPED_YEAR } from "@/lib/wrapped/year";

function day(date: string, contributionCount: number): GitHubContributionDay {
  return { date, contributionCount };
}

function repoEntry(
  nameWithOwner: string,
  commits: number,
  options: {
    isPrivate?: boolean;
    ownerType?: "User" | "Organization";
    languages?: GitHubCommitRepoEntry["repository"]["languages"];
  } = {},
): GitHubCommitRepoEntry {
  const [ownerLogin, name] = nameWithOwner.includes("/")
    ? nameWithOwner.split("/")
    : ["octocat", nameWithOwner];

  return {
    contributions: { totalCount: commits },
    repository: {
      name,
      nameWithOwner,
      isPrivate: options.isPrivate ?? false,
      owner: {
        __typename: options.ownerType ?? "User",
        login: ownerLogin,
      },
      languages: options.languages ?? null,
    },
  };
}

function buildResponse(
  overrides: Partial<{
    days: GitHubContributionDay[];
    totalContributions: number;
    totalCommitContributions?: number;
    totalPullRequestContributions?: number;
    totalIssueContributions?: number;
    totalPullRequestReviewContributions?: number;
    totalRepositoriesWithContributedCommits?: number;
    restrictedContributionsCount?: number;
    hasAnyRestrictedContributions?: boolean;
    repos: GitHubCommitRepoEntry[];
  }> = {},
): GitHubWrappedResponse {
  const days = overrides.days ?? [];
  return {
    viewer: {
      login: "octocat",
      createdAt: "2015-06-01T00:00:00Z",
      followers: { totalCount: 10 },
      following: { totalCount: 8 },
      organizations: { totalCount: 1, nodes: [{ login: "acme" }] },
      publicRepositories: { totalCount: 12 },
      privateRepositories: { totalCount: 3 },
      publicGists: { totalCount: 2 },
      privateGists: { totalCount: 1 },
      mostStarredRepository: {
        nodes: [
          {
            nameWithOwner: "octocat/stars",
            stargazerCount: 50,
            forkCount: 4,
            createdAt: "2018-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
            isPrivate: false,
          },
        ],
      },
      ownedRepositoriesSample: {
        totalCount: 1,
        nodes: [
          {
            nameWithOwner: "octocat/stars",
            name: "stars",
            stargazerCount: 50,
            forkCount: 4,
            createdAt: "2018-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
            isPrivate: false,
            isFork: false,
            watchers: { totalCount: 3 },
            repositoryTopics: { nodes: [{ topic: { name: "typescript" } }] },
            licenseInfo: { name: "MIT License", spdxId: "MIT" },
            languages: {
              totalCount: 1,
              edges: [{ size: 100, node: { name: "TypeScript", color: "#3178c6" } }],
            },
          },
        ],
      },
      oldestOwnedRepository: {
        nodes: [
          {
            nameWithOwner: "octocat/old",
            stargazerCount: 1,
            forkCount: 0,
            createdAt: "2016-01-01T00:00:00Z",
            updatedAt: "2017-01-01T00:00:00Z",
            isPrivate: false,
            watchers: { totalCount: 1 },
          },
        ],
      },
      newestOwnedRepository: {
        nodes: [
          {
            nameWithOwner: "octocat/new",
            stargazerCount: 0,
            forkCount: 0,
            createdAt: "2026-01-15T00:00:00Z",
            updatedAt: "2026-01-15T00:00:00Z",
            isPrivate: false,
            watchers: { totalCount: 0 },
          },
        ],
      },
      forkedRepositories: { totalCount: 0 },
      archivedRepositories: { totalCount: 0 },
      name: "The Octocat",
      avatarUrl: "https://example.com/avatar.png",
      bio: "demo",
      company: "GitHub",
      location: "San Francisco",
      websiteUrl: "https://github.blog",
      isHireable: false,
      contributionsCollection: {
        totalCommitContributions: overrides.totalCommitContributions ?? 0,
        totalPullRequestContributions:
          overrides.totalPullRequestContributions ?? 0,
        totalIssueContributions: overrides.totalIssueContributions ?? 0,
        totalPullRequestReviewContributions:
          overrides.totalPullRequestReviewContributions ?? 0,
        totalRepositoriesWithContributedCommits:
          overrides.totalRepositoriesWithContributedCommits ?? 0,
        restrictedContributionsCount: overrides.restrictedContributionsCount ?? 0,
        hasAnyRestrictedContributions:
          overrides.hasAnyRestrictedContributions ?? false,
        contributionCalendar: {
          totalContributions:
            overrides.totalContributions ??
            days.reduce((sum, entry) => sum + entry.contributionCount, 0),
          weeks: [{ contributionDays: days }],
        },
        commitContributionsByRepository: overrides.repos ?? [],
      },
    },
  };
}

describe("buildWrappedStats", () => {
  it("sums commits from repositories", () => {
    const repos = [repoEntry("octocat/a", 12), repoEntry("octocat/b", 8)];
    assert.equal(sumCommits(repos), 20);
  });

  it("prefers totalCommitContributions over visible repository totals", () => {
    const repos = [repoEntry("octocat/public", 5)];

    assert.equal(resolveTotalCommits(42, repos), 42);
    assert.equal(resolveTotalCommits(0, repos), 5);
  });

  it("uses totalCommitContributions from the API response", () => {
    const stats = buildWrappedStats(
      buildResponse({
        totalCommitContributions: 99,
        repos: [repoEntry("octocat/a", 10)],
      }),
    );

    assert.equal(stats.totalCommits, 99);
  });

  it("builds contribution type shares without equalling totalContributions", () => {
    const types = buildContributionTypes({
      commits: 80,
      pullRequests: 20,
      issues: 0,
      codeReviews: 0,
    });

    assert.equal(types[0].count, 80);
    assert.equal(types[0].shareOfTypedActivity, 80);
    assert.equal(types[1].shareOfTypedActivity, 20);
  });

  it("classifies private and organization repositories from visible commit repos", () => {
    const repos = [
      repoEntry("octocat/private-app", 3, {
        isPrivate: true,
        ownerType: "User",
      }),
      repoEntry("my-org/service", 5, {
        isPrivate: true,
        ownerType: "Organization",
      }),
      repoEntry("octocat/public-app", 2, {
        ownerType: "User",
      }),
    ];

    const breakdown = classifyRepositoryBreakdown(repos, 18);
    assert.equal(breakdown.totalWithCommits, 18);
    assert.equal(breakdown.privateCount, 2);
    assert.equal(breakdown.organizationCount, 1);
    assert.equal(breakdown.personalCount, 2);
    assert.equal(breakdown.sampledFromQuery, 3);
    assert.equal(breakdown.queryLimit, REPOSITORY_QUERY_LIMIT);
  });

  it("does not add restrictedContributionsCount into totals", () => {
    const stats = buildWrappedStats(
      buildResponse({
        totalContributions: 120,
        restrictedContributionsCount: 40,
        hasAnyRestrictedContributions: true,
      }),
    );

    assert.equal(stats.totalContributions, 120);
    assert.equal(stats.restrictedContributionsCount, 40);
    assert.equal(stats.hasRestrictedContributions, true);
  });

  it("uses GitHub totals for every contribution type without duplication", () => {
    const stats = buildWrappedStats(
      buildResponse({
        totalContributions: 120,
        totalCommitContributions: 80,
        totalPullRequestContributions: 20,
        totalIssueContributions: 15,
        totalPullRequestReviewContributions: 5,
        restrictedContributionsCount: 12,
        days: [day("2026-03-01", 4)],
      }),
    );

    assert.equal(stats.totalContributions, 120);
    assert.equal(stats.totalCommits, 80);
    assert.equal(stats.totalPullRequests, 20);
    assert.equal(stats.totalIssues, 15);
    assert.equal(stats.totalCodeReviews, 5);
    assert.equal(stats.restrictedContributionsCount, 12);
  });

  it("uses totalRepositoriesWithContributedCommits for active repositories", () => {
    const stats = buildWrappedStats(
      buildResponse({
        totalRepositoriesWithContributedCommits: 14,
        repos: [repoEntry("octocat/visible", 10)],
      }),
    );

    assert.equal(stats.activeRepositories, 14);
    assert.equal(stats.repositoryBreakdown.totalWithCommits, 14);
  });

  it("falls back to visible repository count when GitHub total is zero", () => {
    const repos = [repoEntry("octocat/a", 3), repoEntry("org/b", 1)];

    assert.equal(resolveActiveRepositories(0, repos), 2);
  });

  it("calculates active days and activity rate", () => {
    const days = [
      day("2026-01-01", 1),
      day("2026-01-02", 0),
      day("2026-01-03", 4),
    ];

    assert.equal(calculateActiveDays(days), 2);
    assert.equal(calculateActivityRate(2), Math.round((2 / WRAPPED_DAYS_IN_YEAR) * 1000) / 10);
  });

  it("calculates longest and current streaks", () => {
    const days = [
      day("2026-01-01", 1),
      day("2026-01-02", 2),
      day("2026-01-03", 0),
      day("2026-01-04", 1),
      day("2026-01-05", 1),
      day("2026-01-06", 1),
      day("2026-01-07", 0),
      day("2026-01-08", 2),
    ];

    const streaks = calculateStreaks(days);
    assert.equal(streaks.longestStreak, 3);
    assert.equal(streaks.currentStreak, 1);
    assert.equal(streaks.streakStartDate, "2026-01-04");
    assert.equal(streaks.streakEndDate, "2026-01-06");
  });

  it("handles streak crossing month boundaries", () => {
    const days = [
      day("2026-01-30", 1),
      day("2026-01-31", 1),
      day("2026-02-01", 1),
      day("2026-02-02", 0),
    ];

    const streaks = calculateStreaks(days);
    assert.equal(streaks.longestStreak, 3);
    assert.equal(streaks.streakStartDate, "2026-01-30");
    assert.equal(streaks.streakEndDate, "2026-02-01");
  });

  it("finds most active day with tie keeping first max", () => {
    const days = [
      day("2026-01-01", 5),
      day("2026-01-02", 8),
      day("2026-01-03", 8),
    ];

    const result = findMostActiveDay(days);
    assert.equal(result.date, "2026-01-02");
    assert.equal(result.count, 8);
  });

  it("calculates average daily contributions over active days", () => {
    assert.equal(calculateAverageDailyContributions(10, 4), 2.5);
    assert.equal(calculateAverageDailyContributions(0, 0), 0);
  });

  it("builds monthly contributions for 2026", () => {
    const days = [
      day("2026-01-10", 2),
      day("2026-02-05", 3),
      day("2026-12-31", 1),
    ];
    const monthly = buildMonthlyContributions(days);

    assert.equal(monthly[0].contributions, 2);
    assert.equal(monthly[1].contributions, 3);
    assert.equal(monthly[11].contributions, 1);
  });

  it("finds most active month", () => {
    const monthly = buildMonthlyContributions([
      day("2026-03-01", 4),
      day("2026-03-02", 4),
      day("2026-04-01", 10),
    ]);

    const result = findMostActiveMonth(monthly);
    assert.equal(result.month, 4);
    assert.equal(result.count, 10);
  });

  it("aggregates languages across repositories", () => {
    const repos = [
      repoEntry("octocat/a", 1, {
        languages: {
          edges: [
            { node: { name: "PHP", color: "#4F5D95" }, size: 500 },
            { node: { name: "JavaScript", color: "#f1e05a" }, size: 300 },
          ],
        },
      }),
      repoEntry("octocat/b", 1, {
        languages: {
          edges: [
            { node: { name: "PHP", color: "#4F5D95" }, size: 200 },
            { node: { name: "Python", color: "#3572A5" }, size: 100 },
          ],
        },
      }),
    ];

    const languages = aggregateLanguages(repos);
    const php = languages.find((lang) => lang.name === "PHP");
    const js = languages.find((lang) => lang.name === "JavaScript");
    const python = languages.find((lang) => lang.name === "Python");

    assert.equal(php?.bytes, 700);
    assert.equal(js?.bytes, 300);
    assert.equal(python?.bytes, 100);
    assert.equal(
      languages.reduce((sum, lang) => sum + lang.pct, 0),
      100,
    );
  });

  it("handles repositories without languages", () => {
    assert.deepEqual(aggregateLanguages([repoEntry("octocat/empty", 3)]), []);
  });

  it("selects top repository by real activity", () => {
    const repos = [repoEntry("octocat/small", 2), repoEntry("octocat/big", 20)];

    const distribution = buildRepositoryDistribution(repos);
    assert.equal(distribution[0]?.nameWithOwner, "octocat/big");
    assert.equal(distribution[0]?.contributions, 20);
  });

  it("shares repository commits against year total, not only sampled repos", () => {
    const repos = [repoEntry("octocat/big", 143), repoEntry("octocat/small", 100)];
    // Sampled sum is 243; year total is higher (API totalCommitContributions).
    const distribution = buildRepositoryDistribution(repos, 500);
    assert.equal(distribution[0]?.pct, 28.6); // 143 / 500
    assert.equal(distribution[1]?.pct, 20); // 100 / 500
  });

  it("groups weekday contributions and weekend split", () => {
    const days = [
      day("2026-01-05", 4),
      day("2026-01-06", 2),
      day("2026-01-10", 6),
      day("2026-01-11", 3),
    ];

    const weekdayContributions = buildWeekdayContributions(days);
    assert.equal(findMostActiveWeekday(weekdayContributions), "saturday");

    const weekend = calculateWeekendActivity(days);
    assert.equal(weekend.weekendContributions, 9);
    assert.equal(weekend.weekdayContributionsTotal, 6);
    assert.equal(weekend.weekendActivityPercentage, 60);
  });

  it("filters only wrapped year days", () => {
    const days = [
      day("2025-12-31", 9),
      day("2026-01-01", 1),
      day("2027-01-01", 9),
    ];

    assert.equal(filterYearDays(days).length, 1);
    assert.equal(filterYearDays(days)[0]?.date, "2026-01-01");
  });

  it("builds heatmap levels from contribution counts", () => {
    const days = [
      day("2025-12-28", 99),
      day("2026-01-01", 0),
      day("2026-01-02", 1),
      day("2026-01-03", 4),
      day("2026-01-04", 8),
    ];

    const heatmap = buildHeatmap(days);
    assert.equal(heatmap[0], 0);
    assert.equal(heatmap[1], 0);
    assert.equal(heatmap[2], 1);
    assert.equal(heatmap[3], 2);
    assert.equal(heatmap[4], 3);
  });

  it("aligns heatmapPeakIndex with mostActiveDay date", () => {
    const days = [
      day("2025-12-28", 1),
      day("2026-01-01", 2),
      day("2026-04-05", 74),
      day("2026-04-06", 3),
    ];
    const stats = buildWrappedStats(buildResponse({ days }));
    assert.equal(stats.mostActiveDay, "2026-04-05");
    assert.equal(stats.heatmapPeakIndex, 2);
    assert.equal(stats.heatmapDates[2], "2026-04-05");
    assert.equal(stats.heatmapDates.length, stats.heatmap.length);
  });

  it("returns empty stats for users without contributions", () => {
    const stats = buildWrappedStats(buildResponse({ days: [] }));
    assert.equal(stats.totalContributions, 0);
    assert.equal(stats.activeDays, 0);
    assert.equal(stats.longestStreak, 0);
    assert.equal(stats.topLanguage, null);
    assert.equal(stats.topRepository, null);
  });

  it("handles single contribution edge case", () => {
    const stats = buildWrappedStats(
      buildResponse({ days: [day("2026-06-15", 1)] }),
    );
    assert.equal(stats.activeDays, 1);
    assert.equal(stats.longestStreak, 1);
    assert.equal(stats.currentStreak, 1);
    assert.equal(stats.mostActiveDay, "2026-06-15");
  });

  it("handles full-year activity", () => {
    const days = Array.from({ length: WRAPPED_DAYS_IN_YEAR }, (_, index) => {
      const month = String(Math.floor(index / 31) + 1).padStart(2, "0");
      const dayNumber = String((index % 31) + 1).padStart(2, "0");
      return day(`2026-${month}-${dayNumber}`, 1);
    }).filter((entry) => entry.date.startsWith(String(WRAPPED_YEAR)));

    const stats = buildWrappedStats(buildResponse({ days }));
    assert.equal(stats.activeDays, days.length);
    assert.equal(stats.longestStreak, days.length);
  });

  it("uses wrapped year in empty stats factory", () => {
    const stats = createEmptyWrappedStats();
    assert.equal(stats.inactiveDays, WRAPPED_DAYS_IN_YEAR);
    assert.equal(stats.monthlyContributions.length, 12);
  });

  it("includes social profile and popularity from viewer", () => {
    const stats = buildWrappedStats(
      buildResponse({
        totalCommitContributions: 1,
        days: [day("2026-02-01", 1)],
        repos: [repoEntry("acme/app", 1, { ownerType: "Organization" })],
      }),
      {
        followers: 42,
        following: 30,
        friends: 12,
        friendsIsComplete: true,
      },
    );

    assert.equal(stats.social.followers, 42);
    assert.equal(stats.social.friends, 12);
    assert.equal(stats.profile.yearsOnGit > 0, true);
    assert.equal(stats.profile.mostActiveOrganization, "acme");
    assert.equal(
      stats.popularity.mostStarredRepository?.nameWithOwner,
      "octocat/stars",
    );
    assert.equal(stats.popularity.totalStars, 50);
    assert.equal(stats.firstActiveDay, "2026-02-01");
    assert.equal(stats.lastActiveDay, "2026-02-01");
  });
});
