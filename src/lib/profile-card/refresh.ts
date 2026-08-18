import { prisma } from "@/lib/db";
import { githubGraphql } from "@/lib/github/client";
import { WRAPPED_YEAR_QUERY } from "@/lib/github/queries";
import {
  clearProfileCardRefreshLock,
  loadProfileCard,
  tryClaimProfileCardRefresh,
  upsertProfileCard,
} from "@/lib/profile-card/store";
import { toProfileUsernameKey } from "@/lib/profile-card/urls";
import { canRefreshProfileCardYear } from "@/lib/profile-card/year-scope";
import { buildWrappedStats } from "@/lib/wrapped/build-stats";
import { emptySocialStats } from "@/lib/wrapped/profile-stats";
import type { GitHubWrappedResponse, WrappedStats } from "@/lib/wrapped/types";

export async function getGitHubAccessTokenForUserId(
  userId: string,
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });
  return account?.access_token ?? null;
}

export async function fetchYearScopedStats(
  token: string,
  year: number,
): Promise<WrappedStats> {
  const from = `${year}-01-01T00:00:00.000Z`;
  const to = `${year}-12-31T23:59:59.999Z`;
  const data = await githubGraphql<GitHubWrappedResponse>(
    token,
    WRAPPED_YEAR_QUERY,
    { from, to },
  );
  return buildWrappedStats(data, emptySocialStats());
}

export async function refreshProfileCard(
  username: string,
  year: number,
): Promise<boolean> {
  if (!canRefreshProfileCardYear(year)) return false;

  const usernameKey = toProfileUsernameKey(username);
  const existing = await loadProfileCard(usernameKey, year);
  if (!existing) return false;

  const claimed = await tryClaimProfileCardRefresh(usernameKey, year);
  if (!claimed) return false;

  const token = await getGitHubAccessTokenForUserId(existing.userId);
  if (!token) {
    await clearProfileCardRefreshLock(existing.id);
    return false;
  }

  try {
    const stats = await fetchYearScopedStats(token, year);
    const login = stats.profile.login || existing.username;
    await upsertProfileCard({
      userId: existing.userId,
      username: login,
      year,
      stats,
      markRefreshed: true,
    });
    return true;
  } catch (error) {
    console.warn(
      `[profile-card] refresh failed for ${usernameKey}/${year}:`,
      error instanceof Error ? error.message : error,
    );
    await clearProfileCardRefreshLock(existing.id);
    return false;
  }
}
