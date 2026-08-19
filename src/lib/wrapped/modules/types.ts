import type { WeekdayKey } from "@/lib/wrapped/year";
import type { ContributionTypeKey } from "@/lib/wrapped/data-sources";

export type Completeness = {
  isComplete: boolean;
};

export type NamedRepo = {
  nameWithOwner: string;
  value: number;
  createdAt?: string | null;
};

export type ProfileModule = {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  websiteUrl: string | null;
  isHireable: boolean;
  accountVerifiedUnsupported: true;
  accountCreatedAt: string | null;
  yearsOnGit: number;
  daysOnGit: number;
  publicGists: number;
  privateGists: number;
};

export type CommunityModule = SocialStats &
  Completeness & {
    followersToFollowingRatio: number | null;
    growthUnsupported: true;
  };

export type SocialStats = {
  followers: number;
  following: number;
  friends: number;
  friendsIsComplete: boolean;
};

export type ContributionTypeStat = {
  type: ContributionTypeKey;
  count: number;
  shareOfTypedActivity: number;
};

export type ActivityModule = {
  totalContributions: number;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  totalCodeReviews: number;
  repositoriesCreatedThisYear: number;
  restrictedContributionsCount: number;
  hasRestrictedContributions: boolean;
  contributionTypes: ContributionTypeStat[];
  activeDays: number;
  inactiveDays: number;
  activityRate: number;
  averageDailyContributions: number;
  averageWeeklyContributions: number;
  averageMonthlyContributions: number;
  averageCommitsPerActiveRepo: number;
};

export type MonthlyContribution = {
  month: number;
  contributions: number;
};

export type WeekdayContribution = {
  weekday: WeekdayKey;
  contributions: number;
};

export type CalendarModule = {
  heatmap: number[];
  heatmapDates: string[];
  heatmapPeakIndex: number | null;
  longestStreak: number;
  currentStreak: number;
  streakStartDate: string | null;
  streakEndDate: string | null;
  mostActiveDay: string | null;
  mostActiveDayCount: number;
  leastActiveDayAmongActive: string | null;
  leastActiveDayCount: number;
  mostActiveMonth: number | null;
  mostActiveMonthCount: number;
  monthlyContributions: MonthlyContribution[];
  mostActiveWeekStart: string | null;
  mostActiveWeekCount: number;
  longestBreakDays: number;
  longestBreakStart: string | null;
  longestBreakEnd: string | null;
  firstActiveDay: string | null;
  lastActiveDay: string | null;
  mostActiveWeekday: WeekdayKey | null;
  weekdayContributions: WeekdayContribution[];
};

export type HabitsModule = {
  weekdayContributionsTotal: number;
  weekendContributions: number;
  weekendActivityPercentage: number;
  weekdayActivityPercentage: number;
  hourOfDayUnsupported: true;
};

export type WrappedLanguageStat = {
  name: string;
  color: string;
  pct: number;
  bytes: number;
};

export type LanguagesModule = {
  topLanguage: string | null;
  topLanguagePercentage: number;
  secondLanguage: string | null;
  secondLanguagePercentage: number;
  thirdLanguage: string | null;
  thirdLanguagePercentage: number;
  languageCount: number;
  languages: WrappedLanguageStat[];
  top10: WrappedLanguageStat[];
  available: boolean;
};

export type RepositoryBreakdown = {
  totalWithCommits: number;
  privateCount: number;
  organizationCount: number;
  personalCount: number;
  sampledFromQuery: number;
  queryLimit: number;
  publicSharePct: number;
  privateSharePct: number;
};

export type RepositoryStat = {
  name: string;
  nameWithOwner: string;
  contributions: number;
  pct: number;
  isPrivate: boolean;
  isOrganizationOwned: boolean;
  primaryLanguage: string | null;
  primaryLanguageColor: string | null;
};

export type RepositoriesModule = {
  publicOwned: number;
  privateOwned: number;
  totalOwned: number;
  forkedOwned: number;
  archivedOwned: number;
  templateOwned: number;
  mirrorOwned: number;
  activeWithCommitsThisYear: number;
  oldestOwned: NamedRepo | null;
  newestOwned: NamedRepo | null;
  favoriteOfYear: NamedRepo | null;
  mostUpdatedOwned: NamedRepo | null;
  leastUpdatedOwned: NamedRepo | null;
  mostLanguagesOwned: NamedRepo | null;
  fewestLanguagesOwned: NamedRepo | null;
  longestNameOwned: NamedRepo | null;
  shortestNameOwned: NamedRepo | null;
  repositoryBreakdown: RepositoryBreakdown;
  repositoryDistribution: RepositoryStat[];
  totalsAreComplete: boolean;
};

export type PopularityModule = {
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  averageStars: number;
  totalsAreComplete: boolean;
  mostStarred: NamedRepo | null;
  mostForked: NamedRepo | null;
  mostWatched: NamedRepo | null;
  mostPopular: NamedRepo | null;
};

export type OrganizationsModule = {
  count: number;
  logins: string[];
  membershipComplete: boolean;
  mostActive: string | null;
  mostActiveCommits: number;
  activeThisYear: string[];
};

export type CollaborationModule = {
  topCommitRepository: NamedRepo | null;
  topPullRequestRepository: NamedRepo | null;
  topIssueRepository: NamedRepo | null;
  topReviewRepository: NamedRepo | null;
  peopleCollaborationUnsupported: true;
};

export type TopicStat = {
  name: string;
  count: number;
};

export type LicenseStat = {
  name: string;
  count: number;
};

export type TechnologiesModule = {
  topTopics: TopicStat[];
  topLicenses: LicenseStat[];
  frameworkInferenceUnsupported: true;
};

export type CuriositiesModule = {
  firstActiveDay: string | null;
  lastActiveDay: string | null;
  mostIntenseDay: string | null;
  mostIntenseDayCount: number;
  mostIntenseWeekStart: string | null;
  mostIntenseWeekCount: number;
  mostIntenseMonth: number | null;
  mostIntenseMonthCount: number;
  longestBreakDays: number;
  projectFavorite: string | null;
  projectMostPopular: string | null;
  projectOldest: string | null;
  projectNewest: string | null;
  longestRepoName: string | null;
  shortestRepoName: string | null;
  mostTopicsRepo: NamedRepo | null;
  fewestTopicsRepo: NamedRepo | null;
};

export type AchievementId =
  | "commit_machine"
  | "streak_master"
  | "weekend_warrior"
  | "polyglot"
  | "open_source_hero"
  | "repo_creator"
  | "community_builder"
  | "star_collector";

export type AchievementTier = "bronze" | "silver" | "gold";

export type Achievement = {
  id: AchievementId;
  unlocked: boolean;
  tier: AchievementTier | null;
  nextTier: AchievementTier | null;
  threshold: number;
  value: number;
  tiers: Record<AchievementTier, boolean>;
};

export type Highlight = {
  id: string;
  score: number;
  templateKey: string;
  values: Record<string, string | number>;
};

export type ProfileStats = ProfileModule & {
  totalOwnedRepositories: number;
  publicRepositories: number;
  privateRepositories: number;
  organizationsCount: number;
  organizationLogins: string[];
  mostActiveOrganization: string | null;
  mostActiveOrganizationCommits: number;
};

export type PopularityStats = {
  totalStars: number;
  totalForks: number;
  totalsAreComplete: boolean;
  mostStarredRepository: NamedRepo | null;
  mostForkedRepository: NamedRepo | null;
  mostPopularRepository: NamedRepo | null;
  oldestOwnedRepository: NamedRepo | null;
  newestOwnedRepository: NamedRepo | null;
};

export type WrappedModules = {
  profile: ProfileModule;
  community: CommunityModule;
  activity: ActivityModule;
  calendar: CalendarModule;
  habits: HabitsModule;
  languages: LanguagesModule;
  repositories: RepositoriesModule;
  popularity: PopularityModule;
  organizations: OrganizationsModule;
  collaboration: CollaborationModule;
  technologies: TechnologiesModule;
  curiosities: CuriositiesModule;
  achievements: Achievement[];
  generatedHighlights: Highlight[];
};
