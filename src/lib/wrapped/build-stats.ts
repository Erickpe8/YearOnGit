import { REPOSITORY_QUERY_LIMIT } from "@/lib/wrapped/data-sources";
import {
  buildHeatmap,
  buildMonthlyContributions,
  buildWeekdayContributions,
  calculateActiveDays,
  calculateActivityRate,
  calculateAverageDailyContributions,
  calculateStreaks,
  calculateWeekendActivity,
  filterYearDays,
  findFirstAndLastActiveDays,
  findMostActiveDay,
  findMostActiveMonth,
  findMostActiveWeekday,
  flattenContributionDays,
  buildCalendarModule,
  buildHabitsModule,
} from "@/lib/wrapped/modules/calendar";
import {
  aggregateLanguages,
  buildContributionTypes,
  buildCommunityModule,
  buildLanguagesModule,
  buildOrganizationsModule,
  buildPopularityModule,
  buildProfileModule,
  buildRepositoriesModule,
  buildRepositoryDistribution,
  calculateDaysOnGit,
  calculateFriends,
  calculateYearsOnGit,
  classifyRepositoryBreakdown,
  composeWrappedModules,
  emptySocialStats,
  modulesToWrappedStats,
  sumCommits,
} from "@/lib/wrapped/modules/compose";
import {
  emptyPopularityStats,
  emptyProfileStats,
} from "@/lib/wrapped/profile-stats";
import type {
  GitHubCommitRepoEntry,
  GitHubWrappedResponse,
  RepositoryBreakdown,
  SocialStats,
  WrappedStats,
} from "@/lib/wrapped/types";
import { WRAPPED_DAYS_IN_YEAR } from "@/lib/wrapped/year";

export {
  aggregateLanguages,
  buildContributionTypes,
  buildHeatmap,
  buildMonthlyContributions,
  buildRepositoryDistribution,
  buildWeekdayContributions,
  calculateActiveDays,
  calculateActivityRate,
  calculateAverageDailyContributions,
  calculateStreaks,
  calculateWeekendActivity,
  classifyRepositoryBreakdown,
  filterYearDays,
  findFirstAndLastActiveDays,
  findMostActiveDay,
  findMostActiveMonth,
  findMostActiveWeekday,
  flattenContributionDays,
  sumCommits,
  buildCommunityModule,
  buildLanguagesModule,
  buildOrganizationsModule,
  buildPopularityModule,
  buildProfileModule,
  buildRepositoriesModule,
  calculateDaysOnGit,
  calculateFriends,
  calculateYearsOnGit,
  emptySocialStats,
};

export function resolveTotalCommits(
  totalCommitContributions: number,
  repos: GitHubCommitRepoEntry[],
): number {
  return totalCommitContributions || sumCommits(repos);
}

export function resolveActiveRepositories(
  totalRepositoriesWithContributedCommits: number,
  repos: GitHubCommitRepoEntry[],
): number {
  if (totalRepositoriesWithContributedCommits > 0) {
    return totalRepositoriesWithContributedCommits;
  }
  return repos.filter((entry) => (entry.contributions?.totalCount ?? 0) > 0)
    .length;
}

export function createEmptyWrappedStats(): WrappedStats {
  const emptyBreakdown: RepositoryBreakdown = {
    totalWithCommits: 0,
    privateCount: 0,
    organizationCount: 0,
    personalCount: 0,
    sampledFromQuery: 0,
    queryLimit: REPOSITORY_QUERY_LIMIT,
    publicSharePct: 0,
    privateSharePct: 0,
  };

  const social = emptySocialStats();
  const calendar = buildCalendarModule([], []);
  const habits = buildHabitsModule([]);
  const languages = buildLanguagesModule([]);
  const contributionTypes = buildContributionTypes({
    commits: 0,
    pullRequests: 0,
    issues: 0,
    codeReviews: 0,
  });

  return {
    profile: emptyProfileStats(),
    community: {
      ...social,
      isComplete: true,
      followersToFollowingRatio: 0,
      growthUnsupported: true,
    },
    activity: {
      totalContributions: 0,
      totalCommits: 0,
      totalPullRequests: 0,
      totalIssues: 0,
      totalCodeReviews: 0,
      repositoriesCreatedThisYear: 0,
      restrictedContributionsCount: 0,
      hasRestrictedContributions: false,
      contributionTypes,
      activeDays: 0,
      inactiveDays: WRAPPED_DAYS_IN_YEAR,
      activityRate: 0,
      averageDailyContributions: 0,
      averageWeeklyContributions: 0,
      averageMonthlyContributions: 0,
      averageCommitsPerActiveRepo: 0,
    },
    calendar,
    habits,
    languages,
    repositories: {
      publicOwned: 0,
      privateOwned: 0,
      totalOwned: 0,
      forkedOwned: 0,
      archivedOwned: 0,
      templateOwned: 0,
      mirrorOwned: 0,
      activeWithCommitsThisYear: 0,
      oldestOwned: null,
      newestOwned: null,
      favoriteOfYear: null,
      mostUpdatedOwned: null,
      leastUpdatedOwned: null,
      mostLanguagesOwned: null,
      fewestLanguagesOwned: null,
      longestNameOwned: null,
      shortestNameOwned: null,
      repositoryBreakdown: emptyBreakdown,
      repositoryDistribution: [],
      totalsAreComplete: true,
    },
    popularity: emptyPopularityStats(),
    organizations: {
      count: 0,
      logins: [],
      membershipComplete: true,
      mostActive: null,
      mostActiveCommits: 0,
      activeThisYear: [],
    },
    collaboration: {
      topCommitRepository: null,
      topPullRequestRepository: null,
      topIssueRepository: null,
      topReviewRepository: null,
      peopleCollaborationUnsupported: true,
    },
    technologies: {
      topTopics: [],
      topLicenses: [],
      frameworkInferenceUnsupported: true,
    },
    curiosities: {
      firstActiveDay: null,
      lastActiveDay: null,
      mostIntenseDay: null,
      mostIntenseDayCount: 0,
      mostIntenseWeekStart: null,
      mostIntenseWeekCount: 0,
      mostIntenseMonth: null,
      mostIntenseMonthCount: 0,
      longestBreakDays: 0,
      projectFavorite: null,
      projectMostPopular: null,
      projectOldest: null,
      projectNewest: null,
      longestRepoName: null,
      shortestRepoName: null,
      mostTopicsRepo: null,
      fewestTopicsRepo: null,
    },
    achievements: [],
    generatedHighlights: [],
    social,
    totalContributions: 0,
    totalCommits: 0,
    totalPullRequests: 0,
    totalIssues: 0,
    totalCodeReviews: 0,
    restrictedContributionsCount: 0,
    hasRestrictedContributions: false,
    contributionTypes,
    activeDays: 0,
    inactiveDays: WRAPPED_DAYS_IN_YEAR,
    activityRate: 0,
    longestStreak: 0,
    currentStreak: 0,
    streakStartDate: null,
    streakEndDate: null,
    mostActiveDay: null,
    mostActiveDayCount: 0,
    averageDailyContributions: 0,
    mostActiveMonth: null,
    mostActiveMonthCount: 0,
    monthlyContributions: buildMonthlyContributions([]),
    firstActiveDay: null,
    lastActiveDay: null,
    topLanguage: null,
    topLanguagePercentage: 0,
    secondLanguage: null,
    secondLanguagePercentage: 0,
    languageCount: 0,
    activeRepositories: 0,
    repositoryBreakdown: emptyBreakdown,
    topRepository: null,
    topRepositoryContributions: 0,
    repositoryDistribution: [],
    mostActiveWeekday: null,
    weekdayContributions: buildWeekdayContributions([]),
    weekendContributions: 0,
    weekdayContributionsTotal: 0,
    weekendActivityPercentage: 0,
    heatmap: buildHeatmap([]),
    heatmapDates: [],
    heatmapPeakIndex: null,
  };
}

export function buildWrappedStats(
  data: GitHubWrappedResponse,
  social?: SocialStats,
): WrappedStats {
  if (!data.viewer) {
    return createEmptyWrappedStats();
  }

  const socialStats: SocialStats = social ?? {
    followers: data.viewer.followers?.totalCount ?? 0,
    following: data.viewer.following?.totalCount ?? 0,
    friends: 0,
    friendsIsComplete: false,
  };

  return modulesToWrappedStats(composeWrappedModules(data, socialStats));
}
