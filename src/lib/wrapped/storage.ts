import type { WrappedPayload } from "@/lib/wrapped/types";

export const WRAPPED_STORAGE_KEY = "yearongit-wrapped-2026-v2";

function hasAlignedHeatmap(payload: WrappedPayload): boolean {
  const { heatmap, heatmapDates, mostActiveDay, heatmapPeakIndex } =
    payload.stats;
  if (!Array.isArray(heatmap) || heatmap.length === 0) return true;
  if (!Array.isArray(heatmapDates) || heatmapDates.length !== heatmap.length) {
    return false;
  }
  if (mostActiveDay) {
    const byDate = heatmapDates.indexOf(mostActiveDay);
    if (byDate < 0) return false;
    if (
      typeof heatmapPeakIndex === "number" &&
      heatmapPeakIndex !== byDate
    ) {
      return false;
    }
  }
  return true;
}

export function saveWrappedPayload(payload: WrappedPayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WRAPPED_STORAGE_KEY, JSON.stringify(payload));
}

export function readWrappedPayload(): WrappedPayload | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(WRAPPED_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as WrappedPayload;
    if (!parsed?.stats || !hasAlignedHeatmap(parsed)) {
      sessionStorage.removeItem(WRAPPED_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearWrappedPayload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(WRAPPED_STORAGE_KEY);
}
