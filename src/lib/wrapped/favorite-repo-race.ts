import type { RepositoryStat } from "@/lib/wrapped/modules/types";
import type { WrappedStats } from "@/lib/wrapped/types";

export type FavoriteRepoRacer = {
  id: string;
  name: string;
  nameWithOwner: string;
  contributions: number;
  place: number;
  pctOfCommits: number;
  primaryLanguage: string | null;
  primaryLanguageColor: string | null;
};

export type FavoriteRepoOption = {
  id: string;
  name: string;
  nameWithOwner: string;
  isCorrect: boolean;
};

export type FavoriteRepoRace = {
  mode: "direct" | "quiz";
  winner: FavoriteRepoRacer;
  racers: FavoriteRepoRacer[];
  options: FavoriteRepoOption[];
};

function toRacer(repo: RepositoryStat, place: number): FavoriteRepoRacer {
  return {
    id: repo.nameWithOwner,
    name: repo.name,
    nameWithOwner: repo.nameWithOwner,
    contributions: repo.contributions,
    place,
    pctOfCommits: repo.pct,
    primaryLanguage: repo.primaryLanguage,
    primaryLanguageColor: repo.primaryLanguageColor,
  };
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
  return items;
}

function shareOfCommits(contributions: number, totalCommits: number): number {
  if (contributions <= 0 || totalCommits <= 0) return 0;
  return Math.round((contributions / totalCommits) * 1000) / 10;
}

export function buildFavoriteRepoRace(
  stats: Pick<
    WrappedStats,
    "repositoryDistribution" | "topRepository" | "topRepositoryContributions"
  > &
    Partial<Pick<WrappedStats, "totalCommits">>,
  options?: { shuffle?: boolean },
): FavoriteRepoRace | null {
  const ranked = stats.repositoryDistribution.filter(
    (repo) => repo.contributions > 0,
  );
  const yearTotal = Math.max(
    stats.totalCommits ?? 0,
    ranked.reduce((sum, repo) => sum + repo.contributions, 0),
  );

  const winnerRepo =
    ranked[0] ??
    (stats.topRepository
      ? ({
          name: stats.topRepository.split("/").pop() ?? stats.topRepository,
          nameWithOwner: stats.topRepository,
          contributions: stats.topRepositoryContributions,
          pct: shareOfCommits(stats.topRepositoryContributions, yearTotal) || 100,
          isPrivate: false,
          isOrganizationOwned: false,
          primaryLanguage: null,
          primaryLanguageColor: null,
        } satisfies RepositoryStat)
      : null);

  if (!winnerRepo || winnerRepo.contributions <= 0) return null;

  const pool =
    ranked.length > 0 ? ranked.slice(0, Math.min(3, ranked.length)) : [winnerRepo];
  const racers = pool.map((repo, index) => {
    const racer = toRacer(repo, index + 1);
    return {
      ...racer,
      pctOfCommits:
        yearTotal > 0
          ? shareOfCommits(racer.contributions, yearTotal)
          : racer.pctOfCommits,
    };
  });
  const winner = racers[0]!;

  if (racers.length < 2) {
    return { mode: "direct", winner, racers, options: [] };
  }

  const choices: FavoriteRepoOption[] = racers.map((racer) => ({
    id: racer.id,
    name: racer.name,
    nameWithOwner: racer.nameWithOwner,
    isCorrect: racer.place === 1,
  }));

  return {
    mode: "quiz",
    winner,
    racers,
    options: options?.shuffle === false ? choices : shuffleInPlace([...choices]),
  };
}

export const QUIZ_ANSWER_WAIT_MS = 5_500;
export const QUIZ_WRONG_FEEDBACK_MS = 900;
export const QUIZ_SHOW_ANSWER_MS = 850;

export function favoriteRepoRaceSettleMs(
  race: FavoriteRepoRace | null,
  reducedMotion: boolean,
): number {
  if (reducedMotion || !race) return 800;
  if (race.mode === "direct") {
    return 4_200;
  }
  return (
    QUIZ_ANSWER_WAIT_MS +
    QUIZ_WRONG_FEEDBACK_MS +
    QUIZ_SHOW_ANSWER_MS +
    2_000
  );
}

export function abbreviateRepoName(name: string, maxChars = 14): string {
  if (name.length <= maxChars) return name;
  return `${name.slice(0, Math.max(1, maxChars - 1))}…`;
}
