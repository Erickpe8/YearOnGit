import {
  DEFAULT_WRAPPED_CONFIG,
  slideAllowedByStats,
  type SlideId,
  type SlideToggle,
  type WrappedAdminConfig,
} from "@/lib/admin/wrapped-config";
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

export type PlanWrappedSlidesOptions = {
  config?: Pick<WrappedAdminConfig, "slides" | "stats">;
  includeDisabled?: boolean;
  onlySlideId?: SlideId;
};

function highlightsForStats(stats: WrappedStats) {
  const highlightsRaw = (stats.generatedHighlights ?? []).slice(0, 8);
  const favoriteHighlight = highlightsRaw.find(
    (highlight) => highlight.id === "favorite_repo",
  );
  const otherHighlights = highlightsRaw.filter(
    (highlight) => highlight.id !== "favorite_repo",
  );
  return { favoriteHighlight, otherHighlights };
}

function buildSlidePool(stats: WrappedStats): Record<SlideId, PlannedSlide[]> {
  const { favoriteHighlight, otherHighlights } = highlightsForStats(stats);
  const typedTotal = stats.contributionTypes.reduce(
    (sum, entry) => sum + entry.count,
    0,
  );

  const showCommunity =
    stats.social.followers > 0 ||
    stats.social.following > 0 ||
    stats.popularity.totalStars > 0 ||
    stats.profile.organizationsCount > 0 ||
    stats.social.friends > 0;

  const achievements = stats.achievements ?? [];
  const extraHighlightLimit = favoriteHighlight
    ? MAX_HIGHLIGHT_SLIDES - 1
    : MAX_HIGHLIGHT_SLIDES;

  return {
    overview: [{ key: "overview", kind: "overview" }],
    "contribution-types":
      typedTotal > 0
        ? [{ key: "contribution-types", kind: "contribution-types" }]
        : [],
    "favorite-repo": favoriteHighlight
      ? [
          {
            key: `highlight-${favoriteHighlight.id}`,
            kind: "highlight",
            highlight: favoriteHighlight,
          },
        ]
      : [],
    heatmap: [{ key: "heatmap", kind: "heatmap" }],
    highlight: otherHighlights.slice(0, extraHighlightLimit).map((highlight) => ({
      key: `highlight-${highlight.id}`,
      kind: "highlight" as const,
      highlight,
    })),
    languages:
      stats.languageCount > 0
        ? [{ key: "languages", kind: "languages" }]
        : [],
    community: showCommunity
      ? [{ key: "community", kind: "community" }]
      : [],
    achievements:
      achievements.length > 0
        ? [{ key: "achievements", kind: "achievements", achievements }]
        : [],
    streak: [{ key: "streak", kind: "streak" }],
    summary: [{ key: "summary", kind: "summary" }],
  };
}

export function planWrappedSlides(
  stats: WrappedStats,
  options: PlanWrappedSlidesOptions = {},
): PlannedSlide[] {
  const slides: SlideToggle[] =
    options.config?.slides ?? DEFAULT_WRAPPED_CONFIG.slides;
  const statToggles = options.config?.stats ?? DEFAULT_WRAPPED_CONFIG.stats;
  const includeDisabled = options.includeDisabled === true;
  const onlySlideId = options.onlySlideId;
  const pool = buildSlidePool(stats);
  const planned: PlannedSlide[] = [];

  for (const item of slides) {
    if (onlySlideId && item.id !== onlySlideId) continue;
    if (!onlySlideId && !item.enabled && !includeDisabled) continue;
    if (!onlySlideId && !slideAllowedByStats(item.id, statToggles)) continue;
    planned.push(...(pool[item.id] ?? []));
  }

  if (onlySlideId) return planned.slice(0, 1);

  return planned;
}
