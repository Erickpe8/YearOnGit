import { achievementsCarouselSettleMs } from "@/components/wrapped/achievements-slide";
import { HIGHLIGHT_BURST_SETTLE_MS } from "@/components/wrapped/number-burst";
import { contributionStorySettleMs } from "@/components/wrapped/contribution-composition-slide";
import { ACHIEVEMENT_CATALOG } from "@/lib/wrapped/achievements-catalog";
import {
  buildFavoriteRepoRace,
  favoriteRepoRaceSettleMs,
} from "@/lib/wrapped/favorite-repo-race";
import {
  heatmapStorySettleMs,
  type HeatmapStoryInsights,
  type HeatmapTeaserLines,
} from "@/lib/wrapped/heatmap-story";
import type { PlannedSlide } from "@/lib/wrapped/plan-slides";
import type { WrappedStats } from "@/lib/wrapped/types";

/** Fallback reading pause after animations on simple slides. */
export const WRAPPED_DWELL_MS = 4_200;

const STORY_CODA_MS = 2_400;

export type SlideRuntime = {
  settleMs: number;
  dwellMs: number;
  durationMs: number;
};

export function slideSettleMs(
  kind: PlannedSlide["kind"],
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 400;

  switch (kind) {
    case "overview":
      return 8_400;
    case "contribution-types":
      return 14_000;
    case "languages":
      return 2_800;
    case "streak":
      return 2_800;
    case "highlight":
      return HIGHLIGHT_BURST_SETTLE_MS;
    case "achievements":
      return 1_200;
    case "heatmap":
      return 1_400;
    case "community":
      return 2_600;
    case "summary":
      return 3_200;
    default:
      return 900;
  }
}

function dwellForKind(kind: PlannedSlide["kind"]): number {
  switch (kind) {
    case "heatmap":
    case "contribution-types":
    case "achievements":
      return STORY_CODA_MS;
    case "overview":
      return 2_800;
    case "languages":
    case "community":
      return 3_200;
    case "streak":
      return 3_200;
    case "highlight":
      return 2_800;
    case "summary":
      return 0;
    default:
      return WRAPPED_DWELL_MS;
  }
}

export function computeSlideRuntime({
  slide,
  reducedMotion,
  stats,
  heatmapStory,
  heatmapTeasers,
}: {
  slide: PlannedSlide;
  reducedMotion: boolean;
  stats: WrappedStats | null;
  heatmapStory: HeatmapStoryInsights | null;
  heatmapTeasers?: HeatmapTeaserLines;
}): SlideRuntime {
  let settleMs = slideSettleMs(slide.kind, reducedMotion);

  if (slide.kind === "contribution-types" && stats) {
    settleMs = contributionStorySettleMs(stats, reducedMotion);
  } else if (
    slide.kind === "highlight" &&
    slide.highlight.id === "favorite_repo" &&
    stats
  ) {
    settleMs = favoriteRepoRaceSettleMs(
      buildFavoriteRepoRace(stats),
      reducedMotion,
    );
  } else if (slide.kind === "heatmap" && stats && heatmapStory) {
    const weekCount = Math.max(1, Math.ceil((stats.heatmap?.length ?? 0) / 7));
    settleMs = heatmapStorySettleMs(
      {
        ...heatmapStory,
        hasPeakDay: Boolean(stats.mostActiveDay),
        hasPeakMonth: Boolean(stats.mostActiveMonth),
      },
      weekCount,
      reducedMotion,
      heatmapTeasers,
    );
  } else if (slide.kind === "achievements") {
    settleMs = achievementsCarouselSettleMs(
      ACHIEVEMENT_CATALOG.length,
      reducedMotion,
    );
  }

  let dwellMs = reducedMotion
    ? Math.min(dwellForKind(slide.kind), 1_200)
    : dwellForKind(slide.kind);

  if (slide.kind === "highlight" && slide.highlight.id === "favorite_repo") {
    dwellMs = reducedMotion ? 800 : STORY_CODA_MS;
  }

  return {
    settleMs,
    dwellMs,
    durationMs: settleMs + dwellMs,
  };
}
