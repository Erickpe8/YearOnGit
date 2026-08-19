import { BY_REPO_LIMIT, OWNED_REPO_SAMPLE, REPOSITORY_QUERY_LIMIT } from "@/lib/wrapped/data-sources";
import { calculateAchievements } from "@/lib/wrapped/modules/achievements";
import {
  buildCalendarModule,
  buildHabitsModule,
  calculateActiveDays,
  calculateActivityRate,
  calculateAverageDailyContributions,
  filterYearDays,
  flattenContributionDays,
} from "@/lib/wrapped/modules/calendar";
import { generateHighlights } from "@/lib/wrapped/modules/highlights";
import type {
  CollaborationModule,
  CommunityModule,
  ContributionTypeStat,
  CuriositiesModule,
  LanguagesModule,
  NamedRepo,
  OrganizationsModule,
  PopularityModule,
  ProfileModule,
  RepositoriesModule,
  RepositoryBreakdown,
  RepositoryStat,
  SocialStats,
  TechnologiesModule,
  WrappedLanguageStat,
  WrappedModules,
} from "@/lib/wrapped/modules/types";
import type {
  GitHubByRepoEntry,
  GitHubCommitRepoEntry,
  GitHubOwnedRepoNode,
  GitHubWrappedResponse,
  WrappedStats,
} from "@/lib/wrapped/types";
import { WRAPPED_DAYS_IN_YEAR, WRAPPED_YEAR } from "@/lib/wrapped/year";
import { CONTRIBUTION_TYPE_KEYS } from "@/lib/wrapped/data-sources";

const DEFAULT_LANGUAGE_COLOR = "#8b949e";

export function countRepositoriesCreatedThisYear(
  collection: NonNullable<
    NonNullable<GitHubWrappedResponse["viewer"]>["contributionsCollection"]
  >,
  ownedNodes: GitHubOwnedRepoNode[] = [],
  year: number = WRAPPED_YEAR,
): number {
  const contributionNodes = collection.repositoryContributions?.nodes;
  if (contributionNodes) {
    const unique = new Set<string>();
    for (const node of contributionNodes) {
      const repo = node?.repository;
      if (!repo?.nameWithOwner) continue;
      if (repo.isFork) continue;
      unique.add(repo.nameWithOwner);
    }
    return unique.size;
  }

  const prefix = String(year);
  const fromOwned = ownedNodes.filter((node) => {
    if (node.isFork) return false;
    const created = node.createdAt ?? "";
    return created.startsWith(prefix);
  }).length;
  if (fromOwned > 0) return fromOwned;

  return collection.totalRepositoryContributions ?? 0;
}

export function calculateYearsOnGit(createdAt: string | null, now = new Date()): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  let years = now.getUTCFullYear() - created.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - created.getUTCMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getUTCDate() < created.getUTCDate())
  ) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function calculateDaysOnGit(createdAt: string | null, now = new Date()): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  const ms = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function calculateFriends(
  followerLogins: string[],
  followingLogins: string[],
  followersTotal: number,
  followingTotal: number,
): SocialStats {
  const followingSet = new Set(followingLogins);
  let friends = 0;
  for (const login of followerLogins) {
    if (followingSet.has(login)) friends += 1;
  }
  return {
    followers: followersTotal,
    following: followingTotal,
    friends,
    friendsIsComplete:
      followerLogins.length >= followersTotal &&
      followingLogins.length >= followingTotal,
  };
}

function toNamed(node: GitHubOwnedRepoNode | null | undefined, value: number): NamedRepo | null {
  if (!node?.nameWithOwner) return null;
  return {
    nameWithOwner: node.nameWithOwner,
    value,
    createdAt: node.createdAt ?? null,
  };
}

function topByRepo(entries: GitHubByRepoEntry[] | undefined): NamedRepo | null {
  if (!entries?.length) return null;
  let best: GitHubByRepoEntry | null = null;
  for (const entry of entries) {
    if (!best || entry.contributions.totalCount > best.contributions.totalCount) {
      best = entry;
    }
  }
  if (!best) return null;
  return {
    nameWithOwner: best.repository.nameWithOwner,
    value: best.contributions.totalCount,
  };
}

export function buildContributionTypes(input: {
  commits: number;
  pullRequests: number;
  issues: number;
  codeReviews: number;
}): ContributionTypeStat[] {
  const items: ContributionTypeStat[] = [
    { type: "commits", count: input.commits, shareOfTypedActivity: 0 },
    { type: "pullRequests", count: input.pullRequests, shareOfTypedActivity: 0 },
    { type: "issues", count: input.issues, shareOfTypedActivity: 0 },
    { type: "codeReviews", count: input.codeReviews, shareOfTypedActivity: 0 },
  ];
  const typedTotal = items.reduce((sum, item) => sum + item.count, 0);
  return items.map((item) => ({
    ...item,
    shareOfTypedActivity:
      typedTotal === 0
        ? 0
        : Math.round((item.count / typedTotal) * 1000) / 10,
  }));
}

export function sumCommits(repos: GitHubCommitRepoEntry[]): number {
  return repos.reduce((sum, entry) => sum + (entry.contributions?.totalCount ?? 0), 0);
}

export function aggregateLanguages(repos: GitHubCommitRepoEntry[]): WrappedLanguageStat[] {
  const totals = new Map<string, { bytes: number; color: string }>();
  for (const entry of repos) {
    for (const edge of entry.repository.languages?.edges ?? []) {
      const name = edge.node.name;
      const prev = totals.get(name);
      const color = edge.node.color ?? DEFAULT_LANGUAGE_COLOR;
      totals.set(name, {
        bytes: (prev?.bytes ?? 0) + edge.size,
        color: prev?.color ?? color,
      });
    }
  }
  const totalBytes = [...totals.values()].reduce((sum, item) => sum + item.bytes, 0);
  const ranked = [...totals.entries()]
    .map(([name, item]) => ({
      name,
      color: item.color,
      bytes: item.bytes,
      pct:
        totalBytes === 0
          ? 0
          : Math.round((item.bytes / totalBytes) * 1000) / 10,
    }))
    .sort((a, b) => b.bytes - a.bytes);
  return ranked;
}

export function classifyRepositoryBreakdown(
  repos: GitHubCommitRepoEntry[],
  activeRepositories: number,
): RepositoryBreakdown {
  let privateCount = 0;
  let organizationCount = 0;
  let personalCount = 0;
  for (const entry of repos) {
    if ((entry.contributions?.totalCount ?? 0) <= 0) continue;
    if (entry.repository.isPrivate) privateCount += 1;
    if (entry.repository.owner.__typename === "Organization") organizationCount += 1;
    else personalCount += 1;
  }
  const sampleActive = privateCount + personalCount > 0
    ? repos.filter((e) => (e.contributions?.totalCount ?? 0) > 0).length
    : 0;
  const denom = sampleActive || 1;
  const publicCount = Math.max(0, sampleActive - privateCount);
  return {
    totalWithCommits: activeRepositories,
    privateCount,
    organizationCount,
    personalCount,
    sampledFromQuery: repos.length,
    queryLimit: REPOSITORY_QUERY_LIMIT,
    publicSharePct:
      sampleActive === 0 ? 0 : Math.round((publicCount / denom) * 1000) / 10,
    privateSharePct:
      sampleActive === 0 ? 0 : Math.round((privateCount / denom) * 1000) / 10,
  };
}

function primaryLanguageFromEdges(
  edges: GitHubCommitRepoEntry["repository"]["languages"],
): { name: string; color: string } | null {
  const ranked = [...(edges?.edges ?? [])].sort((a, b) => b.size - a.size);
  const top = ranked[0];
  if (!top?.node?.name) return null;
  return {
    name: top.node.name,
    color: top.node.color ?? DEFAULT_LANGUAGE_COLOR,
  };
}

export function buildRepositoryDistribution(
  repos: GitHubCommitRepoEntry[],
  totalCommits?: number,
): RepositoryStat[] {
  const sampled = sumCommits(repos);
  const total = Math.max(totalCommits ?? 0, sampled, 1);
  return [...repos]
    .filter((entry) => (entry.contributions?.totalCount ?? 0) > 0)
    .map((entry) => {
      const language = primaryLanguageFromEdges(entry.repository.languages);
      return {
        name: entry.repository.name,
        nameWithOwner: entry.repository.nameWithOwner,
        contributions: entry.contributions.totalCount,
        pct: Math.round((entry.contributions.totalCount / total) * 1000) / 10,
        isPrivate: entry.repository.isPrivate,
        isOrganizationOwned: entry.repository.owner.__typename === "Organization",
        primaryLanguage: language?.name ?? null,
        primaryLanguageColor: language?.color ?? null,
      };
    })
    .sort((a, b) => b.contributions - a.contributions);
}

function ownedSample(viewer: NonNullable<GitHubWrappedResponse["viewer"]>): {
  totalCount: number;
  nodes: GitHubOwnedRepoNode[];
} {
  return (
    viewer.ownedRepositoriesSample ??
    viewer.mostForkedSample ?? { totalCount: 0, nodes: [] }
  );
}

export function buildProfileModule(
  viewer: NonNullable<GitHubWrappedResponse["viewer"]>,
): ProfileModule {
  return {
    login: viewer.login,
    name: viewer.name ?? null,
    avatarUrl: viewer.avatarUrl ?? null,
    bio: viewer.bio ?? null,
    company: viewer.company ?? null,
    location: viewer.location ?? null,
    websiteUrl: viewer.websiteUrl ?? null,
    isHireable: Boolean(viewer.isHireable),
    accountVerifiedUnsupported: true,
    accountCreatedAt: viewer.createdAt ?? null,
    yearsOnGit: calculateYearsOnGit(viewer.createdAt ?? null),
    daysOnGit: calculateDaysOnGit(viewer.createdAt ?? null),
    publicGists: viewer.publicGists?.totalCount ?? 0,
    privateGists: viewer.privateGists?.totalCount ?? 0,
  };
}

export function buildCommunityModule(social: SocialStats): CommunityModule {
  const ratio =
    social.following === 0
      ? social.followers > 0
        ? null
        : 0
      : Math.round((social.followers / social.following) * 100) / 100;
  return {
    ...social,
    isComplete: social.friendsIsComplete,
    followersToFollowingRatio: ratio,
    growthUnsupported: true,
  };
}

export function buildLanguagesModule(repos: GitHubCommitRepoEntry[]): LanguagesModule {
  const languages = aggregateLanguages(repos);
  return {
    topLanguage: languages[0]?.name ?? null,
    topLanguagePercentage: languages[0]?.pct ?? 0,
    secondLanguage: languages[1]?.name ?? null,
    secondLanguagePercentage: languages[1]?.pct ?? 0,
    thirdLanguage: languages[2]?.name ?? null,
    thirdLanguagePercentage: languages[2]?.pct ?? 0,
    languageCount: languages.length,
    languages,
    top10: languages.slice(0, 10),
  };
}

export function buildOrganizationsModule(
  viewer: NonNullable<GitHubWrappedResponse["viewer"]>,
  repos: GitHubCommitRepoEntry[],
): OrganizationsModule {
  const membershipNodes = viewer.organizations?.nodes ?? null;
  const membershipLogins = (membershipNodes ?? [])
    .filter((node): node is { login: string } => Boolean(node?.login))
    .map((node) => node.login);

  const totals = new Map<string, number>();
  for (const entry of repos) {
    if (entry.repository.owner.__typename !== "Organization") continue;
    const login = entry.repository.owner.login;
    totals.set(login, (totals.get(login) ?? 0) + (entry.contributions?.totalCount ?? 0));
  }

  let mostActive: string | null = null;
  let mostActiveCommits = 0;
  for (const [login, count] of totals) {
    if (count > mostActiveCommits) {
      mostActive = login;
      mostActiveCommits = count;
    }
  }

  const activeThisYear = [...totals.entries()]
    .filter(([, count]) => count > 0)
    .map(([login]) => login);

  const membershipComplete = membershipNodes !== null;

  return {
    count: membershipComplete
      ? (viewer.organizations?.totalCount ?? membershipLogins.length)
      : activeThisYear.length,
    logins: membershipComplete ? membershipLogins : activeThisYear,
    membershipComplete,
    mostActive,
    mostActiveCommits,
    activeThisYear,
  };
}

export function buildPopularityModule(
  viewer: NonNullable<GitHubWrappedResponse["viewer"]>,
): PopularityModule {
  const sample = ownedSample(viewer);
  const nodes = sample.nodes ?? [];
  const totalsAreComplete = sample.totalCount <= Math.max(nodes.length, OWNED_REPO_SAMPLE);

  let totalStars = 0;
  let totalForks = 0;
  let totalWatchers = 0;
  let mostForked: GitHubOwnedRepoNode | null = null;
  let mostWatched: GitHubOwnedRepoNode | null = null;

  for (const node of nodes) {
    totalStars += node.stargazerCount ?? 0;
    totalForks += node.forkCount ?? 0;
    const watchers = node.watchers?.totalCount ?? 0;
    totalWatchers += watchers;
    if (!mostForked || (node.forkCount ?? 0) > (mostForked.forkCount ?? 0)) {
      mostForked = node;
    }
    if (!mostWatched || watchers > (mostWatched.watchers?.totalCount ?? 0)) {
      mostWatched = node;
    }
  }

  const mostStarred = viewer.mostStarredRepository?.nodes?.[0] ?? null;
  const mostStarredMetric = toNamed(mostStarred, mostStarred?.stargazerCount ?? 0);
  const ownedCount = Math.max(nodes.length, 1);

  return {
    totalStars,
    totalForks,
    totalWatchers,
    averageStars: Math.round((totalStars / ownedCount) * 10) / 10,
    totalsAreComplete,
    mostStarred: mostStarredMetric,
    mostForked: toNamed(mostForked, mostForked?.forkCount ?? 0),
    mostWatched: toNamed(mostWatched, mostWatched?.watchers?.totalCount ?? 0),
    mostPopular: mostStarredMetric,
  };
}

export function buildRepositoriesModule(
  viewer: NonNullable<GitHubWrappedResponse["viewer"]>,
  repos: GitHubCommitRepoEntry[],
  activeRepositories: number,
  totalCommits?: number,
): RepositoriesModule {
  const sample = ownedSample(viewer);
  const nodes = sample.nodes ?? [];
  const distribution = buildRepositoryDistribution(repos, totalCommits);
  const favorite = distribution[0]
    ? {
        nameWithOwner: distribution[0].nameWithOwner,
        value: distribution[0].contributions,
      }
    : null;

  let mostUpdated: GitHubOwnedRepoNode | null = null;
  let leastUpdated: GitHubOwnedRepoNode | null = null;
  let mostLangs: GitHubOwnedRepoNode | null = null;
  let fewestLangs: GitHubOwnedRepoNode | null = null;
  let longestName: GitHubOwnedRepoNode | null = null;
  let shortestName: GitHubOwnedRepoNode | null = null;

  for (const node of nodes) {
    if (!mostUpdated || (node.updatedAt ?? "") > (mostUpdated.updatedAt ?? "")) {
      mostUpdated = node;
    }
    if (!leastUpdated || (node.updatedAt ?? "") < (leastUpdated.updatedAt ?? "")) {
      leastUpdated = node;
    }
    const langCount = node.languages?.totalCount ?? node.languages?.edges?.length ?? 0;
    if (!mostLangs || langCount > (mostLangs.languages?.totalCount ?? mostLangs.languages?.edges?.length ?? 0)) {
      mostLangs = node;
    }
    if (
      !fewestLangs ||
      langCount < (fewestLangs.languages?.totalCount ?? fewestLangs.languages?.edges?.length ?? Infinity)
    ) {
      fewestLangs = node;
    }
    const name = node.name ?? node.nameWithOwner.split("/")[1] ?? node.nameWithOwner;
    const longName = longestName?.name ?? longestName?.nameWithOwner.split("/")[1] ?? "";
    const shortName = shortestName?.name ?? shortestName?.nameWithOwner.split("/")[1] ?? name;
    if (!longestName || name.length > longName.length) longestName = node;
    if (!shortestName || name.length < shortName.length) shortestName = node;
  }

  const publicOwned = viewer.publicRepositories?.totalCount ?? 0;
  const privateOwned = viewer.privateRepositories?.totalCount ?? 0;
  const templateOwned = nodes.filter((node) => node.isTemplate).length;

  return {
    publicOwned,
    privateOwned,
    totalOwned: publicOwned + privateOwned,
    forkedOwned: viewer.forkedRepositories?.totalCount ?? 0,
    archivedOwned: viewer.archivedRepositories?.totalCount ?? 0,
    templateOwned,
    mirrorOwned: 0,
    activeWithCommitsThisYear: activeRepositories,
    oldestOwned: toNamed(viewer.oldestOwnedRepository?.nodes?.[0], 0),
    newestOwned: toNamed(viewer.newestOwnedRepository?.nodes?.[0], 0),
    favoriteOfYear: favorite,
    mostUpdatedOwned: toNamed(mostUpdated, 0),
    leastUpdatedOwned: toNamed(leastUpdated, 0),
    mostLanguagesOwned: toNamed(
      mostLangs,
      mostLangs?.languages?.totalCount ?? mostLangs?.languages?.edges?.length ?? 0,
    ),
    fewestLanguagesOwned: toNamed(
      fewestLangs,
      fewestLangs?.languages?.totalCount ?? fewestLangs?.languages?.edges?.length ?? 0,
    ),
    longestNameOwned: toNamed(longestName, 0),
    shortestNameOwned: toNamed(shortestName, 0),
    repositoryBreakdown: classifyRepositoryBreakdown(repos, activeRepositories),
    repositoryDistribution: distribution,
    totalsAreComplete: sample.totalCount <= Math.max(nodes.length, OWNED_REPO_SAMPLE),
  };
}

export function buildTechnologiesModule(
  viewer: NonNullable<GitHubWrappedResponse["viewer"]>,
): TechnologiesModule {
  const nodes = ownedSample(viewer).nodes ?? [];
  const topics = new Map<string, number>();
  const licenses = new Map<string, number>();

  for (const node of nodes) {
    for (const topicNode of node.repositoryTopics?.nodes ?? []) {
      const name = topicNode?.topic?.name;
      if (!name) continue;
      topics.set(name, (topics.get(name) ?? 0) + 1);
    }
    const license = node.licenseInfo?.spdxId || node.licenseInfo?.name;
    if (license) licenses.set(license, (licenses.get(license) ?? 0) + 1);
  }

  return {
    topTopics: [...topics.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    topLicenses: [...licenses.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    frameworkInferenceUnsupported: true,
  };
}

export function buildCollaborationModule(
  collection: NonNullable<GitHubWrappedResponse["viewer"]>["contributionsCollection"],
  commitRepos: GitHubCommitRepoEntry[],
): CollaborationModule {
  const topCommit = buildRepositoryDistribution(commitRepos)[0];
  return {
    topCommitRepository: topCommit
      ? { nameWithOwner: topCommit.nameWithOwner, value: topCommit.contributions }
      : null,
    topPullRequestRepository: topByRepo(collection.pullRequestContributionsByRepository),
    topIssueRepository: topByRepo(collection.issueContributionsByRepository),
    topReviewRepository: topByRepo(
      collection.pullRequestReviewContributionsByRepository,
    ),
    peopleCollaborationUnsupported: true,
  };
}

export function buildCuriositiesModule(
  modules: Omit<WrappedModules, "curiosities" | "achievements" | "generatedHighlights">,
): CuriositiesModule {
  const { calendar, repositories, popularity, technologies } = modules;
  const sampleNodes = repositories;

  let mostTopics: NamedRepo | null = null;
  let fewestTopics: NamedRepo | null = null;
  void technologies;
  void sampleNodes;

  return {
    firstActiveDay: calendar.firstActiveDay,
    lastActiveDay: calendar.lastActiveDay,
    mostIntenseDay: calendar.mostActiveDay,
    mostIntenseDayCount: calendar.mostActiveDayCount,
    mostIntenseWeekStart: calendar.mostActiveWeekStart,
    mostIntenseWeekCount: calendar.mostActiveWeekCount,
    mostIntenseMonth: calendar.mostActiveMonth,
    mostIntenseMonthCount: calendar.mostActiveMonthCount,
    longestBreakDays: calendar.longestBreakDays,
    projectFavorite: repositories.favoriteOfYear?.nameWithOwner ?? null,
    projectMostPopular: popularity.mostPopular?.nameWithOwner ?? null,
    projectOldest: repositories.oldestOwned?.nameWithOwner ?? null,
    projectNewest: repositories.newestOwned?.nameWithOwner ?? null,
    longestRepoName: repositories.longestNameOwned?.nameWithOwner ?? null,
    shortestRepoName: repositories.shortestNameOwned?.nameWithOwner ?? null,
    mostTopicsRepo: mostTopics,
    fewestTopicsRepo: fewestTopics,
  };
}

function buildCuriositiesWithTopics(
  modules: Omit<WrappedModules, "curiosities" | "achievements" | "generatedHighlights">,
  viewer: NonNullable<GitHubWrappedResponse["viewer"]>,
): CuriositiesModule {
  const base = buildCuriositiesModule(modules);
  const nodes = ownedSample(viewer).nodes ?? [];
  let mostTopics: GitHubOwnedRepoNode | null = null;
  let fewestTopics: GitHubOwnedRepoNode | null = null;
  for (const node of nodes) {
    const count = node.repositoryTopics?.nodes?.filter(Boolean).length ?? 0;
    if (!mostTopics || count > (mostTopics.repositoryTopics?.nodes?.filter(Boolean).length ?? 0)) {
      mostTopics = node;
    }
    if (
      !fewestTopics ||
      count < (fewestTopics.repositoryTopics?.nodes?.filter(Boolean).length ?? Infinity)
    ) {
      fewestTopics = node;
    }
  }
  return {
    ...base,
    mostTopicsRepo: toNamed(
      mostTopics,
      mostTopics?.repositoryTopics?.nodes?.filter(Boolean).length ?? 0,
    ),
    fewestTopicsRepo: toNamed(
      fewestTopics,
      fewestTopics?.repositoryTopics?.nodes?.filter(Boolean).length ?? 0,
    ),
  };
}

export function emptySocialStats(): SocialStats {
  return { followers: 0, following: 0, friends: 0, friendsIsComplete: true };
}

export function composeWrappedModules(
  data: GitHubWrappedResponse,
  social: SocialStats,
  options?: { year?: number; daysInYear?: number },
): WrappedModules {
  const viewer = data.viewer;
  if (!viewer) {
    throw new Error("Missing viewer");
  }

  const year = options?.year ?? WRAPPED_YEAR;
  const daysInYear = options?.daysInYear ?? WRAPPED_DAYS_IN_YEAR;
  const collection = viewer.contributionsCollection;
  const repos = collection.commitContributionsByRepository ?? [];
  const calendarWeeks = collection.contributionCalendar.weeks;
  const allDays = flattenContributionDays(calendarWeeks);
  const yearDays = filterYearDays(allDays, year);

  const totalCommits =
    collection.totalCommitContributions || sumCommits(repos);
  const totalPullRequests = collection.totalPullRequestContributions;
  const totalIssues = collection.totalIssueContributions;
  const totalCodeReviews = collection.totalPullRequestReviewContributions;
  const totalContributions = collection.contributionCalendar.totalContributions;
  const activeRepositories =
    collection.totalRepositoriesWithContributedCommits ||
    repos.filter((entry) => (entry.contributions?.totalCount ?? 0) > 0).length;

  const activeDays = calculateActiveDays(yearDays);
  const calendar = buildCalendarModule(yearDays, allDays, year);
  const habits = buildHabitsModule(yearDays);
  const languages = buildLanguagesModule(repos);
  const profile = buildProfileModule(viewer);
  const community = buildCommunityModule(social);
  const organizations = buildOrganizationsModule(viewer, repos);
  const popularity = buildPopularityModule(viewer);
  const repositories = buildRepositoriesModule(
    viewer,
    repos,
    activeRepositories,
    totalCommits,
  );
  const technologies = buildTechnologiesModule(viewer);
  const collaboration = buildCollaborationModule(collection, repos);

  const sample = ownedSample(viewer);
  const repositoriesCreatedThisYear = countRepositoriesCreatedThisYear(
    collection,
    sample.nodes ?? [],
    year,
  );

  const activity = {
    totalContributions,
    totalCommits,
    totalPullRequests,
    totalIssues,
    totalCodeReviews,
    repositoriesCreatedThisYear,
    restrictedContributionsCount: collection.restrictedContributionsCount,
    hasRestrictedContributions: collection.hasAnyRestrictedContributions,
    contributionTypes: buildContributionTypes({
      commits: totalCommits,
      pullRequests: totalPullRequests,
      issues: totalIssues,
      codeReviews: totalCodeReviews,
    }),
    activeDays,
    inactiveDays: daysInYear - activeDays,
    activityRate: calculateActivityRate(activeDays, daysInYear),
    averageDailyContributions: calculateAverageDailyContributions(
      totalContributions,
      activeDays,
    ),
    averageWeeklyContributions:
      Math.round((totalContributions / 52) * 10) / 10,
    averageMonthlyContributions:
      Math.round((totalContributions / 12) * 10) / 10,
    averageCommitsPerActiveRepo:
      activeRepositories === 0
        ? 0
        : Math.round((totalCommits / activeRepositories) * 10) / 10,
  };

  const partial = {
    profile,
    community,
    activity,
    calendar,
    habits,
    languages,
    repositories,
    popularity,
    organizations,
    collaboration,
    technologies,
  };

  const curiosities = buildCuriositiesWithTopics(partial, viewer);
  const withCuriosities = { ...partial, curiosities };
  const achievements = calculateAchievements({
    ...withCuriosities,
    achievements: [],
    generatedHighlights: [],
  });
  const generatedHighlights = generateHighlights({
    ...withCuriosities,
    achievements,
    generatedHighlights: [],
  });

  return {
    ...withCuriosities,
    achievements,
    generatedHighlights,
  };
}

export function modulesToWrappedStats(modules: WrappedModules): WrappedStats {
  const legacyProfile = {
    ...modules.profile,
    totalOwnedRepositories: modules.repositories.totalOwned,
    publicRepositories: modules.repositories.publicOwned,
    privateRepositories: modules.repositories.privateOwned,
    organizationsCount: modules.organizations.count,
    organizationLogins: modules.organizations.logins,
    mostActiveOrganization: modules.organizations.mostActive,
    mostActiveOrganizationCommits: modules.organizations.mostActiveCommits,
  };

  return {
    ...modules,
    totalContributions: modules.activity.totalContributions,
    totalCommits: modules.activity.totalCommits,
    totalPullRequests: modules.activity.totalPullRequests,
    totalIssues: modules.activity.totalIssues,
    totalCodeReviews: modules.activity.totalCodeReviews,
    restrictedContributionsCount: modules.activity.restrictedContributionsCount,
    hasRestrictedContributions: modules.activity.hasRestrictedContributions,
    contributionTypes: modules.activity.contributionTypes,
    activeDays: modules.activity.activeDays,
    inactiveDays: modules.activity.inactiveDays,
    activityRate: modules.activity.activityRate,
    longestStreak: modules.calendar.longestStreak,
    currentStreak: modules.calendar.currentStreak,
    streakStartDate: modules.calendar.streakStartDate,
    streakEndDate: modules.calendar.streakEndDate,
    mostActiveDay: modules.calendar.mostActiveDay,
    mostActiveDayCount: modules.calendar.mostActiveDayCount,
    averageDailyContributions: modules.activity.averageDailyContributions,
    mostActiveMonth: modules.calendar.mostActiveMonth,
    mostActiveMonthCount: modules.calendar.mostActiveMonthCount,
    monthlyContributions: modules.calendar.monthlyContributions,
    firstActiveDay: modules.calendar.firstActiveDay,
    lastActiveDay: modules.calendar.lastActiveDay,
    topLanguage: modules.languages.topLanguage,
    topLanguagePercentage: modules.languages.topLanguagePercentage,
    secondLanguage: modules.languages.secondLanguage,
    secondLanguagePercentage: modules.languages.secondLanguagePercentage,
    languageCount: modules.languages.languageCount,
    languages: modules.languages,
    activeRepositories: modules.repositories.activeWithCommitsThisYear,
    repositoryBreakdown: modules.repositories.repositoryBreakdown,
    topRepository: modules.repositories.favoriteOfYear?.nameWithOwner ?? null,
    topRepositoryContributions: modules.repositories.favoriteOfYear?.value ?? 0,
    repositoryDistribution: modules.repositories.repositoryDistribution,
    mostActiveWeekday: modules.calendar.mostActiveWeekday,
    weekdayContributions: modules.calendar.weekdayContributions,
    weekendContributions: modules.habits.weekendContributions,
    weekdayContributionsTotal: modules.habits.weekdayContributionsTotal,
    weekendActivityPercentage: modules.habits.weekendActivityPercentage,
    heatmap: modules.calendar.heatmap,
    heatmapDates: modules.calendar.heatmapDates,
    heatmapPeakIndex: modules.calendar.heatmapPeakIndex,
    social: {
      followers: modules.community.followers,
      following: modules.community.following,
      friends: modules.community.friends,
      friendsIsComplete: modules.community.friendsIsComplete,
    },
    profile: legacyProfile,
    popularity: {
      totalStars: modules.popularity.totalStars,
      totalForks: modules.popularity.totalForks,
      totalsAreComplete: modules.popularity.totalsAreComplete,
      mostStarredRepository: modules.popularity.mostStarred,
      mostForkedRepository: modules.popularity.mostForked,
      mostPopularRepository: modules.popularity.mostPopular,
      oldestOwnedRepository: modules.repositories.oldestOwned,
      newestOwnedRepository: modules.repositories.newestOwned,
    },
  };
}

void CONTRIBUTION_TYPE_KEYS;
void BY_REPO_LIMIT;
