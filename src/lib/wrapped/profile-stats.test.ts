import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateFriends,
  calculateYearsOnGit,
  findFirstAndLastActiveDays,
  findMostActiveOrganization,
} from "@/lib/wrapped/profile-stats";
import type { GitHubCommitRepoEntry } from "@/lib/wrapped/types";

describe("profile-stats", () => {
  it("calculates years on Git from createdAt", () => {
    const now = new Date("2026-08-12T00:00:00Z");
    assert.equal(calculateYearsOnGit("2015-06-01T00:00:00Z", now), 11);
    assert.equal(calculateYearsOnGit("2026-01-01T00:00:00Z", now), 0);
  });

  it("computes friends as followers ∩ following", () => {
    const social = calculateFriends(
      ["alice", "bob", "carol"],
      ["bob", "dave", "carol"],
      3,
      3,
    );
    assert.equal(social.friends, 2);
    assert.equal(social.friendsIsComplete, true);
    assert.equal(social.followers, 3);
    assert.equal(social.following, 3);
  });

  it("marks friends incomplete when totals exceed fetched logins", () => {
    const social = calculateFriends(["alice"], ["alice"], 150, 150);
    assert.equal(social.friends, 1);
    assert.equal(social.friendsIsComplete, false);
  });

  it("finds first and last active days", () => {
    const result = findFirstAndLastActiveDays([
      { date: "2026-01-02", contributionCount: 0 },
      { date: "2026-03-10", contributionCount: 2 },
      { date: "2026-01-05", contributionCount: 1 },
      { date: "2026-12-01", contributionCount: 4 },
    ]);
    assert.equal(result.firstActiveDay, "2026-01-05");
    assert.equal(result.lastActiveDay, "2026-12-01");
  });

  it("finds most active organization from commit repos", () => {
    const repos = [
      {
        contributions: { totalCount: 3 },
        repository: {
          name: "a",
          nameWithOwner: "acme/a",
          isPrivate: false,
          owner: { __typename: "Organization", login: "acme" },
          languages: null,
        },
      },
      {
        contributions: { totalCount: 10 },
        repository: {
          name: "b",
          nameWithOwner: "beta/b",
          isPrivate: false,
          owner: { __typename: "Organization", login: "beta" },
          languages: null,
        },
      },
      {
        contributions: { totalCount: 5 },
        repository: {
          name: "c",
          nameWithOwner: "acme/c",
          isPrivate: true,
          owner: { __typename: "Organization", login: "acme" },
          languages: null,
        },
      },
    ] as GitHubCommitRepoEntry[];

    const result = findMostActiveOrganization(repos);
    assert.equal(result.login, "beta");
    assert.equal(result.commits, 10);
  });
});
