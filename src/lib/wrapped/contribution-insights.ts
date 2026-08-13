import type { ContributionTypeKey } from "@/lib/wrapped/data-sources";
import type { WrappedStats } from "@/lib/wrapped/types";

export type ContributionNarrativeKey =
  | "buildFocused"
  | "balanced"
  | "collabFocused";

export type ContributionBreakdownItem = {
  type: ContributionTypeKey;
  count: number;
  percentage: number;
};

export type ContributionInsights = {
  commitPercentage: number;
  pullRequestPercentage: number;
  issuePercentage: number;
  reviewPercentage: number;
  collaborativeActions: number;
  commitsPerPullRequest: number | null;
  contributionBreakdown: ContributionBreakdownItem[];
  narrative: ContributionNarrativeKey;
  totalContributions: number;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  totalCodeReviews: number;
};

function pctOfTotal(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function resolveNarrative(commitPercentage: number): ContributionNarrativeKey {
  if (commitPercentage > 80) return "buildFocused";
  if (commitPercentage >= 50) return "balanced";
  return "collabFocused";
}

export function buildContributionInsights(
  stats: Pick<
    WrappedStats,
    | "totalContributions"
    | "totalCommits"
    | "totalPullRequests"
    | "totalIssues"
    | "totalCodeReviews"
  >,
): ContributionInsights {
  const totalContributions = Math.max(0, stats.totalContributions);
  const totalCommits = Math.max(0, stats.totalCommits);
  const totalPullRequests = Math.max(0, stats.totalPullRequests);
  const totalIssues = Math.max(0, stats.totalIssues);
  const totalCodeReviews = Math.max(0, stats.totalCodeReviews);

  const commitPercentage = pctOfTotal(totalCommits, totalContributions);
  const pullRequestPercentage = pctOfTotal(
    totalPullRequests,
    totalContributions,
  );
  const issuePercentage = pctOfTotal(totalIssues, totalContributions);
  const reviewPercentage = pctOfTotal(totalCodeReviews, totalContributions);
  const collaborativeActions =
    totalPullRequests + totalIssues + totalCodeReviews;
  const commitsPerPullRequest =
    totalPullRequests > 0
      ? Math.round(totalCommits / totalPullRequests)
      : null;

  const contributionBreakdown: ContributionBreakdownItem[] = [
    {
      type: "commits",
      count: totalCommits,
      percentage: commitPercentage,
    },
    {
      type: "pullRequests",
      count: totalPullRequests,
      percentage: pullRequestPercentage,
    },
    {
      type: "issues",
      count: totalIssues,
      percentage: issuePercentage,
    },
    {
      type: "codeReviews",
      count: totalCodeReviews,
      percentage: reviewPercentage,
    },
  ];

  return {
    commitPercentage,
    pullRequestPercentage,
    issuePercentage,
    reviewPercentage,
    collaborativeActions,
    commitsPerPullRequest,
    contributionBreakdown,
    narrative: resolveNarrative(commitPercentage),
    totalContributions,
    totalCommits,
    totalPullRequests,
    totalIssues,
    totalCodeReviews,
  };
}
