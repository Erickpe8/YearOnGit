import type { WeekdayKey } from "@/lib/wrapped/year";
import type { ContributionTypeKey } from "@/lib/wrapped/data-sources";
import type {
  Achievement,
  ActivityModule,
  CalendarModule,
  CollaborationModule,
  CommunityModule,
  ContributionTypeStat,
  CuriositiesModule,
  HabitsModule,
  Highlight,
  LanguagesModule,
  MonthlyContribution,
  NamedRepo,
  OrganizationsModule,
  PopularityModule,
  PopularityStats,
  ProfileModule,
  ProfileStats,
  RepositoriesModule,
  RepositoryBreakdown,
  RepositoryStat,
  SocialStats,
  TechnologiesModule,
  WeekdayContribution,
  WrappedLanguageStat,
  WrappedModules,
} from "@/lib/wrapped/modules/types";

export type {
  Achievement,
  ActivityModule,
  CalendarModule,
  CollaborationModule,
  CommunityModule,
  ContributionTypeStat,
  CuriositiesModule,
  HabitsModule,
  Highlight,
  LanguagesModule,
  MonthlyContribution,
  NamedRepo,
  OrganizationsModule,
  PopularityModule,
  PopularityStats,
  ProfileModule,
  ProfileStats,
  RepositoriesModule,
  RepositoryBreakdown,
  RepositoryStat,
  SocialStats,
  TechnologiesModule,
  WeekdayContribution,
  WrappedLanguageStat,
  WrappedModules,
};

/** @deprecated alias — use NamedRepo */
export type NamedRepositoryMetric = NamedRepo;

export type WrappedStats = Omit<WrappedModules, "profile" | "popularity"> & {
  profile: ProfileStats;
  popularity: PopularityStats;
  social: SocialStats;
  totalContributions: number;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  totalCodeReviews: number;
  restrictedContributionsCount: number;
  hasRestrictedContributions: boolean;
  contributionTypes: ContributionTypeStat[];
  activeDays: number;
  inactiveDays: number;
  activityRate: number;
  longestStreak: number;
  currentStreak: number;
  streakStartDate: string | null;
  streakEndDate: string | null;
  mostActiveDay: string | null;
  mostActiveDayCount: number;
  averageDailyContributions: number;
  mostActiveMonth: number | null;
  mostActiveMonthCount: number;
  monthlyContributions: MonthlyContribution[];
  firstActiveDay: string | null;
  lastActiveDay: string | null;
  topLanguage: string | null;
  topLanguagePercentage: number;
  secondLanguage: string | null;
  secondLanguagePercentage: number;
  languageCount: number;
  activeRepositories: number;
  repositoryBreakdown: RepositoryBreakdown;
  topRepository: string | null;
  topRepositoryContributions: number;
  repositoryDistribution: RepositoryStat[];
  mostActiveWeekday: WeekdayKey | null;
  weekdayContributions: WeekdayContribution[];
  weekendContributions: number;
  weekdayContributionsTotal: number;
  weekendActivityPercentage: number;
  heatmap: number[];
  heatmapDates: string[];
  heatmapPeakIndex: number | null;
};

export type WrappedPayload = {
  stats: WrappedStats;
  username: string;
  year: number;
};

export type GitHubContributionDay = {
  date: string;
  contributionCount: number;
};

export type GitHubRepoLanguageEdge = {
  node: { name: string; color: string | null };
  size: number;
};

export type GitHubOwnedRepoNode = {
  nameWithOwner: string;
  name?: string;
  stargazerCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt?: string;
  isPrivate: boolean;
  isFork?: boolean;
  isArchived?: boolean;
  isTemplate?: boolean;
  watchers?: { totalCount: number };
  primaryLanguage?: { name: string; color: string | null } | null;
  languages?: {
    totalCount?: number;
    edges: GitHubRepoLanguageEdge[];
  } | null;
  repositoryTopics?: {
    nodes: Array<{ topic: { name: string } } | null>;
  } | null;
  licenseInfo?: { name: string; spdxId: string | null } | null;
};

export type GitHubCommitRepoEntry = {
  contributions: { totalCount: number };
  repository: {
    name: string;
    nameWithOwner: string;
    isPrivate: boolean;
    owner: {
      __typename: "User" | "Organization";
      login: string;
    };
    languages: {
      edges: GitHubRepoLanguageEdge[];
    } | null;
  };
};

export type GitHubByRepoEntry = {
  contributions: { totalCount: number };
  repository: { nameWithOwner: string };
};

export type GitHubWrappedResponse = {
  viewer: {
    login: string;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    company: string | null;
    location: string | null;
    websiteUrl: string | null;
    isHireable: boolean;
    createdAt: string;
    followers: { totalCount: number };
    following: { totalCount: number };
    organizations?: {
      totalCount: number;
      nodes: Array<{ login: string } | null>;
    };
    pinnedItems?: {
      nodes: Array<{ nameWithOwner?: string } | null>;
    };
    publicRepositories: { totalCount: number };
    privateRepositories?: { totalCount: number };
    forkedRepositories?: { totalCount: number };
    archivedRepositories?: { totalCount: number };
    publicGists: { totalCount: number };
    privateGists?: { totalCount: number };
    mostStarredRepository?: { nodes: GitHubOwnedRepoNode[] };
    ownedRepositoriesSample?: {
      totalCount: number;
      nodes: GitHubOwnedRepoNode[];
    };
    /** @deprecated query alias kept for older fixtures — prefer ownedRepositoriesSample */
    mostForkedSample?: {
      totalCount: number;
      nodes: GitHubOwnedRepoNode[];
    };
    oldestOwnedRepository?: { nodes: GitHubOwnedRepoNode[] };
    newestOwnedRepository?: { nodes: GitHubOwnedRepoNode[] };
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalPullRequestReviewContributions: number;
      totalRepositoriesWithContributedCommits: number;
      totalRepositoriesWithContributedPullRequests?: number;
      totalRepositoriesWithContributedIssues?: number;
      totalRepositoriesWithContributedPullRequestReviews?: number;
      totalRepositoryContributions?: number;
      repositoryContributions?: {
        totalCount: number;
        nodes: Array<{
          repository: {
            nameWithOwner: string;
            isFork?: boolean | null;
            createdAt?: string | null;
          } | null;
        } | null>;
      };
      restrictedContributionsCount: number;
      hasAnyRestrictedContributions: boolean;
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{
          contributionDays: GitHubContributionDay[];
        }>;
      };
      commitContributionsByRepository: GitHubCommitRepoEntry[];
      pullRequestContributionsByRepository?: GitHubByRepoEntry[];
      issueContributionsByRepository?: GitHubByRepoEntry[];
      pullRequestReviewContributionsByRepository?: GitHubByRepoEntry[];
    };
  } | null;
};

export type GitHubSocialLoginsResponse = {
  viewer: {
    followers: {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Array<{ login: string } | null>;
    };
    following: {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Array<{ login: string } | null>;
    };
  } | null;
};

export type { ContributionTypeKey, WeekdayKey };
