import type { Achievement, Highlight } from "@/lib/wrapped/modules/types";
import type { WrappedStats } from "@/lib/wrapped/types";

export const MAX_HIGHLIGHT_SLIDES = 3;

export type PlannedSlide =
  | { key: string; kind: "overview" }
  | { key: string; kind: "contribution-types" }
  | { key: string; kind: "heatmap" }
  | { key: string; kind: "languages" }
  | { key: string; kind: "community" }
  | { key: string; kind: "streak" }
  | { key: string; kind: "highlight"; highlight: Highlight }
  | { key: string; kind: "achievements"; achievements: Achievement[] }
  | { key: string; kind: "summary" };

export function planWrappedSlides(stats: WrappedStats): PlannedSlide[] {
  const slides: PlannedSlide[] = [{ key: "overview", kind: "overview" }];

  const typedTotal = stats.contributionTypes.reduce(
    (sum, entry) => sum + entry.count,
    0,
  );
  if (typedTotal > 0) {
    slides.push({ key: "contribution-types", kind: "contribution-types" });
  }

  const highlightsRaw = (stats.generatedHighlights ?? []).slice(0, 8);
  const favoriteHighlight = highlightsRaw.find(
    (highlight) => highlight.id === "favorite_repo",
  );
  const otherHighlights = highlightsRaw.filter(
    (highlight) => highlight.id !== "favorite_repo",
  );
  const highlights = (
    favoriteHighlight
      ? [favoriteHighlight, ...otherHighlights]
      : otherHighlights
  ).slice(0, MAX_HIGHLIGHT_SLIDES);

  if (highlights[0]) {
    slides.push({
      key: `highlight-${highlights[0].id}`,
      kind: "highlight",
      highlight: highlights[0],
    });
  }

  slides.push({ key: "heatmap", kind: "heatmap" });

  if (highlights[1]) {
    slides.push({
      key: `highlight-${highlights[1].id}`,
      kind: "highlight",
      highlight: highlights[1],
    });
  }

  if (stats.languageCount > 0) {
    slides.push({ key: "languages", kind: "languages" });
  }

  if (highlights[2]) {
    slides.push({
      key: `highlight-${highlights[2].id}`,
      kind: "highlight",
      highlight: highlights[2],
    });
  }

  const showCommunity =
    stats.social.followers > 0 ||
    stats.social.following > 0 ||
    stats.popularity.totalStars > 0 ||
    stats.profile.organizationsCount > 0 ||
    stats.social.friends > 0;

  if (showCommunity) {
    slides.push({ key: "community", kind: "community" });
  }

  const achievements = stats.achievements ?? [];
  if (achievements.length > 0) {
    slides.push({
      key: "achievements",
      kind: "achievements",
      achievements,
    });
  }

  slides.push({ key: "streak", kind: "streak" });
  slides.push({ key: "summary", kind: "summary" });

  return slides;
}
