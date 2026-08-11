export type WrappedLanguageStat = {
  name: string;
  color: string;
  pct: number;
};

export type WrappedStats = {
  commits: number;
  contributions: number;
  streakDays: number;
  topPercent: number;
  languages: WrappedLanguageStat[];
  heatmap: number[];
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
  { name: "Shell", color: "#89e051" },
  { name: "CSS", color: "#563d7c" },
  { name: "HTML", color: "#e34c26" },
] as const;

const HEATMAP_CELLS = 26 * 7;

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
  const raw = Array.from({ length: count }, () => randomInt(8, 40));
  const total = raw.reduce((sum, value) => sum + value, 0);

  const scaled = raw.map((value) => Math.max(5, Math.round((value / total) * 100)));
  const drift = 100 - scaled.reduce((sum, value) => sum + value, 0);
  scaled[0] += drift;

  return scaled;
}

function randomHeatmap(): number[] {
  return Array.from({ length: HEATMAP_CELLS }, () => {
    const roll = Math.random();
    if (roll < 0.35) return 0;
    if (roll < 0.6) return 1;
    if (roll < 0.85) return 2;
    return 3;
  });
}

function randomLanguages(): WrappedLanguageStat[] {
  const picked = shuffle(LANGUAGE_POOL).slice(0, 3);
  const percentages = splitPercentages(3);

  return picked.map((language, index) => ({
    ...language,
    pct: percentages[index],
  }));
}

export function generateRandomWrappedStats(): WrappedStats {
  const commits = randomInt(180, 1842);
  const streakDays = randomInt(9, 97);
  const contributions = commits + randomInt(-24, 48);

  return {
    commits,
    contributions: Math.max(commits - 40, contributions),
    streakDays,
    topPercent: randomInt(4, 22),
    languages: randomLanguages(),
    heatmap: randomHeatmap(),
  };
}
