import type { WrappedLanguageStat } from "@/lib/wrapped/random-stats";

export type LandingPreviewStats = {
  commits: number;
  repos: number;
  contributions: number;
  streak: number;
  commitsAccent: string;
  languages: WrappedLanguageStat[];
  streakBars: number[];
};

const LANGUAGE_POOL = [
  { name: "TypeScript", color: "#3178c6" },
  { name: "JavaScript", color: "#f1e05a" },
  { name: "Python", color: "#3572A5" },
  { name: "Rust", color: "#dea584" },
  { name: "Go", color: "#00ADD8" },
  { name: "Java", color: "#b07219" },
  { name: "C++", color: "#f34b7d" },
  { name: "Ruby", color: "#701516" },
  { name: "PHP", color: "#4F5D95" },
  { name: "Swift", color: "#F05138" },
  { name: "Kotlin", color: "#A97BFF" },
  { name: "C#", color: "#178600" },
] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function splitPercentages(count: number): number[] {
  const raw = Array.from({ length: count }, () => randomInt(10, 45));
  const total = raw.reduce((sum, value) => sum + value, 0);
  const scaled = raw.map((value) => Math.max(8, Math.round((value / total) * 100)));
  const drift = 100 - scaled.reduce((sum, value) => sum + value, 0);
  scaled[0] += drift;
  return scaled;
}

function randomLanguages(count: number): WrappedLanguageStat[] {
  const picked = shuffle(LANGUAGE_POOL).slice(0, count);
  const percentages = splitPercentages(count);

  return picked.map((language, index) => ({
    ...language,
    pct: percentages[index],
  }));
}

function randomStreakBars(streak: number): number[] {
  const bars = 7;
  return Array.from({ length: bars }, (_, index) => {
    const progress = (index + 1) / bars;
    return Math.max(4, Math.round(streak * progress * (0.82 + Math.random() * 0.18)));
  });
}

function pickAccentColor(): string {
  return LANGUAGE_POOL[randomInt(0, LANGUAGE_POOL.length - 1)].color;
}

export function darkenHex(hex: string, amount = 0.28): string {
  const normalized = hex.replace("#", "");
  const channels = [0, 2, 4].map((start) =>
    Math.max(0, Math.round(parseInt(normalized.slice(start, start + 2), 16) * (1 - amount))),
  );

  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function generateLandingPreviewStats(): LandingPreviewStats {
  const commits = randomInt(320, 1284);
  const streak = randomInt(11, 41);

  return {
    commits,
    repos: randomInt(4, 22),
    contributions: commits + randomInt(-18, 36),
    streak,
    commitsAccent: pickAccentColor(),
    languages: randomLanguages(2),
    streakBars: randomStreakBars(streak),
  };
}
