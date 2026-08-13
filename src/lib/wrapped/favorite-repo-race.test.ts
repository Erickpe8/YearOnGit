import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  abbreviateRepoName,
  buildFavoriteRepoRace,
  favoriteRepoRaceSettleMs,
} from "@/lib/wrapped/favorite-repo-race";
import type { RepositoryStat } from "@/lib/wrapped/modules/types";

function repo(
  partial: Partial<RepositoryStat> &
    Pick<RepositoryStat, "name" | "nameWithOwner" | "contributions">,
): RepositoryStat {
  return {
    pct: 0,
    isPrivate: false,
    isOrganizationOwned: false,
    primaryLanguage: null,
    primaryLanguageColor: null,
    ...partial,
  };
}

describe("buildFavoriteRepoRace", () => {
  it("returns null without active repos", () => {
    assert.equal(
      buildFavoriteRepoRace({
        repositoryDistribution: [],
        topRepository: null,
        topRepositoryContributions: 0,
      }),
      null,
    );
  });

  it("uses direct mode for a single repo", () => {
    const race = buildFavoriteRepoRace({
      repositoryDistribution: [
        repo({
          name: "Solo",
          nameWithOwner: "me/Solo",
          contributions: 40,
          pct: 100,
          primaryLanguage: "TypeScript",
        }),
      ],
      topRepository: "me/Solo",
      topRepositoryContributions: 40,
    });
    assert.ok(race);
    assert.equal(race.mode, "direct");
    assert.equal(race.options.length, 0);
    assert.equal(race.winner.place, 1);
  });

  it("builds shuffled quiz options from real repos", () => {
    const race = buildFavoriteRepoRace(
      {
        repositoryDistribution: [
          repo({ name: "A", nameWithOwner: "me/A", contributions: 100, pct: 70 }),
          repo({ name: "B", nameWithOwner: "me/B", contributions: 40, pct: 30 }),
        ],
        topRepository: "me/A",
        topRepositoryContributions: 100,
      },
      { shuffle: false },
    );
    assert.ok(race);
    assert.equal(race.mode, "quiz");
    assert.equal(race.options.length, 2);
    assert.equal(race.options.filter((o) => o.isCorrect).length, 1);
    assert.equal(race.options[0]?.nameWithOwner, "me/A");
  });

  it("caps racers and options at three", () => {
    const race = buildFavoriteRepoRace(
      {
        repositoryDistribution: [
          repo({ name: "Top", nameWithOwner: "me/Top", contributions: 200, pct: 50 }),
          repo({ name: "Two", nameWithOwner: "me/Two", contributions: 80, pct: 20 }),
          repo({ name: "Three", nameWithOwner: "me/Three", contributions: 60, pct: 15 }),
          repo({ name: "Four", nameWithOwner: "me/Four", contributions: 40, pct: 10 }),
        ],
        topRepository: "me/Top",
        topRepositoryContributions: 200,
      },
      { shuffle: false },
    );
    assert.ok(race);
    assert.equal(race.racers.length, 3);
    assert.equal(race.options.length, 3);
    assert.equal(race.winner.name, "Top");
  });
  it("recalculates share against year total commits", () => {
    const race = buildFavoriteRepoRace({
      repositoryDistribution: [
        repo({
          name: "MultiLab",
          nameWithOwner: "me/MultiLab",
          contributions: 143,
          // Inflated share from "sampled repos only" (old bug).
          pct: 36.8,
        }),
        repo({ name: "Other", nameWithOwner: "me/Other", contributions: 100, pct: 25.7 }),
      ],
      topRepository: "me/MultiLab",
      topRepositoryContributions: 143,
      totalCommits: 500,
    });
    assert.ok(race);
    assert.equal(race.winner.pctOfCommits, 28.6);
  });
});

describe("favoriteRepoRaceSettleMs", () => {
  it("is short under reduced motion", () => {
    const race = buildFavoriteRepoRace({
      repositoryDistribution: [
        repo({ name: "A", nameWithOwner: "me/A", contributions: 10, pct: 100 }),
      ],
      topRepository: "me/A",
      topRepositoryContributions: 10,
    });
    assert.equal(favoriteRepoRaceSettleMs(race, true), 800);
  });
});

describe("abbreviateRepoName", () => {
  it("truncates long names", () => {
    assert.equal(abbreviateRepoName("Short"), "Short");
    assert.equal(abbreviateRepoName("Ayudandonos_Backend", 14).endsWith("…"), true);
  });
});
