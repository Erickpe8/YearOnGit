import { GitHubGraphQLError, githubGraphql } from "@/lib/github/client";
import {
  ORGANIZATIONS_QUERY,
  OWNED_REPOS_QUERY,
  SOCIAL_LOGINS_QUERY,
  WRAPPED_YEAR_QUERY,
} from "@/lib/github/queries";
import {
  applyAdminStats,
  wrappedQueryWindow,
  type WrappedAdminConfig,
} from "@/lib/admin/wrapped-config";
import { buildWrappedStats } from "@/lib/wrapped/build-stats";
import { fetchFriendsSocialStats, emptySocialStats } from "@/lib/wrapped/profile-stats";
import type { GitHubWrappedResponse, WrappedPayload } from "@/lib/wrapped/types";

type OrganizationsResponse = {
  viewer: {
    organizations: NonNullable<
      NonNullable<GitHubWrappedResponse["viewer"]>["organizations"]
    >;
  } | null;
};

type OwnedReposResponse = {
  viewer: Partial<NonNullable<GitHubWrappedResponse["viewer"]>> | null;
};

async function fetchOptional<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown optional fetch error";
    console.warn(`[wrapped] optional ${label} skipped:`, message);
    return null;
  }
}

function mergeOwnedRepos(
  viewer: NonNullable<GitHubWrappedResponse["viewer"]>,
  owned: OwnedReposResponse["viewer"],
) {
  if (!owned) return;

  viewer.privateRepositories = owned.privateRepositories ?? {
    totalCount: 0,
  };
  viewer.privateGists = owned.privateGists ?? { totalCount: 0 };
  viewer.mostStarredRepository = owned.mostStarredRepository ?? { nodes: [] };
  viewer.ownedRepositoriesSample = owned.ownedRepositoriesSample ?? {
    totalCount: 0,
    nodes: [],
  };
  viewer.oldestOwnedRepository = owned.oldestOwnedRepository ?? { nodes: [] };
  viewer.newestOwnedRepository = owned.newestOwnedRepository ?? { nodes: [] };
}

export async function fetchViewerWrapped(
  token: string,
  config: WrappedAdminConfig,
): Promise<WrappedPayload> {
  const window = wrappedQueryWindow(config);
  const data = await githubGraphql<GitHubWrappedResponse>(
    token,
    WRAPPED_YEAR_QUERY,
    { from: window.from, to: window.to },
  );

  if (!data.viewer?.login) {
    throw new GitHubGraphQLError("Unable to load GitHub profile", 502);
  }

  data.viewer.privateRepositories = { totalCount: 0 };
  data.viewer.privateGists = { totalCount: 0 };
  data.viewer.mostStarredRepository = { nodes: [] };
  data.viewer.ownedRepositoriesSample = { totalCount: 0, nodes: [] };
  data.viewer.oldestOwnedRepository = { nodes: [] };
  data.viewer.newestOwnedRepository = { nodes: [] };

  const [owned, organizations, social] = await Promise.all([
    fetchOptional("owned-repos", () =>
      githubGraphql<OwnedReposResponse>(token, OWNED_REPOS_QUERY, {}),
    ),
    fetchOptional("organizations", () =>
      githubGraphql<OrganizationsResponse>(token, ORGANIZATIONS_QUERY, {}),
    ),
    fetchOptional("social", () =>
      fetchFriendsSocialStats(token, githubGraphql, SOCIAL_LOGINS_QUERY),
    ),
  ]);

  mergeOwnedRepos(data.viewer, owned?.viewer ?? null);

  if (organizations?.viewer?.organizations) {
    data.viewer.organizations = organizations.viewer.organizations;
  }

  const stats = applyAdminStats(
    buildWrappedStats(data, social ?? emptySocialStats(), {
      year: window.year,
      daysInYear: window.daysInYear,
    }),
    config,
  );

  return {
    stats,
    username: data.viewer.login,
    year: window.year,
  };
}
