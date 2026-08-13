import { NextResponse } from "next/server";
import { GitHubGraphQLError, githubGraphql } from "@/lib/github/client";
import {
  ORGANIZATIONS_QUERY,
  OWNED_REPOS_QUERY,
  SOCIAL_LOGINS_QUERY,
  WRAPPED_YEAR_QUERY,
} from "@/lib/github/queries";
import { getGitHubAccessToken, requireAuth } from "@/lib/auth/session";
import { buildWrappedStats } from "@/lib/wrapped/build-stats";
import { fetchFriendsSocialStats } from "@/lib/wrapped/profile-stats";
import type { GitHubWrappedResponse } from "@/lib/wrapped/types";
import { WRAPPED_FROM, WRAPPED_TO, WRAPPED_YEAR } from "@/lib/wrapped/year";
import { emptySocialStats } from "@/lib/wrapped/profile-stats";

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
    console.warn(`[api/wrapped] optional ${label} skipped:`, message);
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

export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getGitHubAccessToken();
  if (!token) {
    return NextResponse.json(
      { error: "GitHub account not connected" },
      { status: 401 },
    );
  }

  try {
    const data = await githubGraphql<GitHubWrappedResponse>(
      token,
      WRAPPED_YEAR_QUERY,
      { from: WRAPPED_FROM, to: WRAPPED_TO },
    );

    if (!data.viewer?.login) {
      return NextResponse.json(
        { error: "Unable to load GitHub profile" },
        { status: 502 },
      );
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

    const stats = buildWrappedStats(data, social ?? emptySocialStats());

    return NextResponse.json({
      stats,
      username: data.viewer.login,
      year: WRAPPED_YEAR,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load wrapped stats";
    console.error("[api/wrapped]", message);

    if (error instanceof GitHubGraphQLError) {
      return NextResponse.json({ error: message }, { status: error.status });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
