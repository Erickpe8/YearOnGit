import type { PlannedSlide } from "@/lib/wrapped/plan-slides";
import { HIGHLIGHT_BURST_SETTLE_MS } from "@/components/wrapped/number-burst";

export const WRAPPED_DWELL_MS = 3_000;

export function slideSettleMs(
  kind: PlannedSlide["kind"],
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;

  switch (kind) {
    case "overview":
      return 6_500;
    case "contribution-types":
      return 28_000;
    case "languages":
      return 1400;
    case "streak":
      return 2_200;
    case "highlight":
      return HIGHLIGHT_BURST_SETTLE_MS;
    case "achievements":
      return 1_000;
    case "heatmap":
      return 1_200;
    case "community":
      return 1100;
    case "summary":
      return 2_400;
    default:
      return 800;
  }
}
