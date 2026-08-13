import { SOCIAL_MAX_PAGES } from "@/lib/wrapped/data-sources";
import {
  calculateDaysOnGit,
  calculateFriends,
  calculateYearsOnGit,
} from "@/lib/wrapped/modules/compose";
import type {
  GitHubCommitRepoEntry,
  GitHubSocialLoginsResponse,
  PopularityStats,
  ProfileStats,
  SocialStats,
} from "@/lib/wrapped/types";

export { findFirstAndLastActiveDays } from "@/lib/wrapped/modules/calendar";
export { calculateDaysOnGit, calculateFriends, calculateYearsOnGit };

export function findMostActiveOrganization(
  repos: GitHubCommitRepoEntry[],
): { login: string | null; commits: number } {
  const totals = new Map<string, number>();
  for (const entry of repos) {
    if (entry.repository.owner.__typename !== "Organization") continue;
    const login = entry.repository.owner.login;
    totals.set(
      login,
      (totals.get(login) ?? 0) + (entry.contributions?.totalCount ?? 0),
    );
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [login, count] of totals) {
    if (count > bestCount) {
      best = login;
      bestCount = count;
    }
  }
  return { login: best, commits: bestCount };
}

export function emptySocialStats(): SocialStats {
  return {
    followers: 0,
    following: 0,
    friends: 0,
    friendsIsComplete: true,
  };
}

export function emptyProfileStats(): ProfileStats {
  return {
    login: "",
    name: null,
    avatarUrl: null,
    bio: null,
    company: null,
    location: null,
    websiteUrl: null,
    isHireable: false,
    accountVerifiedUnsupported: true,
    accountCreatedAt: null,
    yearsOnGit: 0,
    daysOnGit: 0,
    publicGists: 0,
    privateGists: 0,
    totalOwnedRepositories: 0,
    publicRepositories: 0,
    privateRepositories: 0,
    organizationsCount: 0,
    organizationLogins: [],
    mostActiveOrganization: null,
    mostActiveOrganizationCommits: 0,
  };
}

export function emptyPopularityStats(): PopularityStats {
  return {
    totalStars: 0,
    totalForks: 0,
    totalsAreComplete: true,
    mostStarredRepository: null,
    mostForkedRepository: null,
    mostPopularRepository: null,
    oldestOwnedRepository: null,
    newestOwnedRepository: null,
  };
}

type GraphqlFn = <T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
) => Promise<T>;

type SocialLoginConnection = NonNullable<
  GitHubSocialLoginsResponse["viewer"]
>["followers"];

async function fetchLoginSide(
  token: string,
  githubGraphql: GraphqlFn,
  socialQuery: string,
  side: "followers" | "following",
): Promise<{ total: number; logins: string[]; complete: boolean }> {
  const logins: string[] = [];
  let cursor: string | null = null;
  let total = 0;
  let complete = true;

  for (let page = 0; page < SOCIAL_MAX_PAGES; page += 1) {
    const data: GitHubSocialLoginsResponse = await githubGraphql(
      token,
      socialQuery,
      {
        followersCursor: side === "followers" ? cursor : null,
        followingCursor: side === "following" ? cursor : null,
      },
    );

    const connection: SocialLoginConnection | undefined =
      side === "followers" ? data.viewer?.followers : data.viewer?.following;
    if (!connection) break;

    total = connection.totalCount;
    for (const node of connection.nodes) {
      if (node?.login) logins.push(node.login);
    }

    if (!connection.pageInfo.hasNextPage) {
      complete = true;
      break;
    }

    cursor = connection.pageInfo.endCursor;
    if (page === SOCIAL_MAX_PAGES - 1) {
      complete = logins.length >= total;
    }
  }

  return { total, logins, complete };
}

export async function fetchFriendsSocialStats(
  token: string,
  githubGraphql: GraphqlFn,
  socialQuery: string,
): Promise<SocialStats> {
  const [followers, following] = await Promise.all([
    fetchLoginSide(token, githubGraphql, socialQuery, "followers"),
    fetchLoginSide(token, githubGraphql, socialQuery, "following"),
  ]);

  const social = calculateFriends(
    followers.logins,
    following.logins,
    followers.total,
    following.total,
  );

  return {
    ...social,
    friendsIsComplete: followers.complete && following.complete,
  };
}
