import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContributionInsights } from "@/lib/wrapped/contribution-insights";

describe("buildContributionInsights", () => {
  it("computes commit share against totalContributions", () => {
    const insights = buildContributionInsights({
      totalContributions: 2113,
      totalCommits: 2036,
      totalPullRequests: 39,
      totalIssues: 23,
      totalCodeReviews: 1,
    });

    assert.equal(insights.commitPercentage, 96.4);
    assert.equal(insights.pullRequestPercentage, 1.8);
    assert.equal(insights.issuePercentage, 1.1);
    assert.equal(insights.reviewPercentage, 0);
    assert.equal(insights.collaborativeActions, 63);
    assert.equal(insights.commitsPerPullRequest, 52);
    assert.equal(insights.narrative, "buildFocused");
    assert.equal(insights.contributionBreakdown[0]?.percentage, 96.4);
    assert.equal(insights.contributionBreakdown[1]?.percentage, 1.8);
    assert.equal(insights.contributionBreakdown[2]?.percentage, 1.1);
    assert.equal(insights.contributionBreakdown[3]?.percentage, 0);
  });

  it("returns null commitsPerPullRequest when there are no PRs", () => {
    const insights = buildContributionInsights({
      totalContributions: 100,
      totalCommits: 100,
      totalPullRequests: 0,
      totalIssues: 0,
      totalCodeReviews: 0,
    });

    assert.equal(insights.commitsPerPullRequest, null);
    assert.equal(insights.collaborativeActions, 0);
  });

  it("picks balanced and collab narratives from commit share", () => {
    assert.equal(
      buildContributionInsights({
        totalContributions: 100,
        totalCommits: 65,
        totalPullRequests: 20,
        totalIssues: 10,
        totalCodeReviews: 5,
      }).narrative,
      "balanced",
    );

    assert.equal(
      buildContributionInsights({
        totalContributions: 100,
        totalCommits: 40,
        totalPullRequests: 30,
        totalIssues: 20,
        totalCodeReviews: 10,
      }).narrative,
      "collabFocused",
    );
  });

  it("handles zero totals without inventing percentages", () => {
    const insights = buildContributionInsights({
      totalContributions: 0,
      totalCommits: 0,
      totalPullRequests: 0,
      totalIssues: 0,
      totalCodeReviews: 0,
    });

    assert.equal(insights.commitPercentage, 0);
    assert.equal(insights.narrative, "collabFocused");
    for (const item of insights.contributionBreakdown) {
      assert.equal(item.percentage, 0);
    }
  });
});
