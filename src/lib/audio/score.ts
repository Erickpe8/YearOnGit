import type { PlannedSlide } from "@/lib/wrapped/plan-slides";

export type Intensity = 1 | 2 | 3 | 4 | 5;

export type GrooveId =
  | "ambient"
  | "house"
  | "techHouse"
  | "techno"
  | "guaracha"
  | "boogaloo"
  | "festival";

export type TrackId =
  | "glamourIntro"
  | "techRoll"
  | "heatPulse"
  | "languageHouse"
  | "communityDeep"
  | "streakAcid"
  | "guarachaPeak"
  | "boogalooMontuno"
  | "festivalDrop"
  | "summaryPiano"
  | "sparkHouse";

export type LayerMix = {
  pads: number;
  kick: number;
  hats: number;
  snare: number;
  bass: number;
  arp: number;
  lead: number;
};

export type MusicScene = {
  id: string;
  intensity: Intensity;
  groove: GrooveId;
  track: TrackId;
  layers: LayerMix;
  cutoff: number;
  morphMs: number;
};

function scene(
  id: string,
  intensity: Intensity,
  groove: GrooveId,
  track: TrackId,
  layers: LayerMix,
  cutoff: number,
  morphMs = 4_050,
): MusicScene {
  return { id, intensity, groove, track, layers, cutoff, morphMs };
}

export const LOADING_SCENE = scene("loading", 1, "ambient", "glamourIntro", {
  pads: 0.82,
  kick: 0.08,
  hats: 0.1,
  snare: 0,
  bass: 0.32,
  arp: 0.55,
  lead: 0.38,
}, 780, 4_200);

export const IDLE_SCENE = scene("idle", 1, "ambient", "glamourIntro", {
  pads: 0.7,
  kick: 0.05,
  hats: 0.06,
  snare: 0,
  bass: 0.22,
  arp: 0.42,
  lead: 0.28,
}, 640, 3_600);

export function sceneFromSlide(slide: PlannedSlide): MusicScene {
  switch (slide.kind) {
    case "overview":
      return scene("overview", 1, "ambient", "glamourIntro", {
        pads: 1,
        kick: 0.1,
        hats: 0.06,
        snare: 0,
        bass: 0.5,
        arp: 0.82,
        lead: 0.55,
      }, 820, 4_400);
    case "contribution-types":
      return scene("contribution-types", 3, "techHouse", "techRoll", {
        pads: 0.14,
        kick: 0.86,
        hats: 0.58,
        snare: 0.5,
        bass: 1,
        arp: 0.48,
        lead: 0.5,
      }, 6_400, 4_050);
    case "heatmap":
      return scene("heatmap", 2, "techno", "heatPulse", {
        pads: 0.7,
        kick: 0.88,
        hats: 0.24,
        snare: 0.12,
        bass: 0.95,
        arp: 0.9,
        lead: 0.7,
      }, 1_650, 4_400);
    case "languages":
      return scene("languages", 3, "house", "languageHouse", {
        pads: 0.22,
        kick: 0.82,
        hats: 0.5,
        snare: 0.46,
        bass: 1,
        arp: 0.52,
        lead: 0.48,
      }, 6_600, 3_800);
    case "community":
      return scene("community", 2, "house", "communityDeep", {
        pads: 0.45,
        kick: 0.7,
        hats: 0.28,
        snare: 0.32,
        bass: 0.88,
        arp: 0.4,
        lead: 0.72,
      }, 4_800, 4_050);
    case "streak":
      return scene("streak", 4, "techno", "streakAcid", {
        pads: 0.16,
        kick: 0.95,
        hats: 0.5,
        snare: 0.45,
        bass: 1,
        arp: 0.82,
        lead: 0.92,
      }, 8_200, 3_600);
    case "achievements":
      return scene("achievements", 5, "guaracha", "guarachaPeak", {
        pads: 0.12,
        kick: 0.95,
        hats: 0.72,
        snare: 0.72,
        bass: 1,
        arp: 0.7,
        lead: 1,
      }, 11_000, 3_400);
    case "summary":
      return scene("summary", 4, "house", "summaryPiano", {
        pads: 0.62,
        kick: 0.58,
        hats: 0.22,
        snare: 0.28,
        bass: 0.78,
        arp: 0.85,
        lead: 0.6,
      }, 4_800, 4_400);
    case "highlight":
      if (slide.highlight.id === "favorite_repo") {
        return scene("highlight-favorite_repo", 4, "boogaloo", "boogalooMontuno", {
          pads: 0.22,
          kick: 0.86,
          hats: 0.55,
          snare: 0.58,
          bass: 0.95,
          arp: 1,
          lead: 1,
        }, 7_200, 3_400);
      }
      if (
        slide.highlight.id === "most_starred" ||
        slide.highlight.id === "best_month"
      ) {
        return scene(`highlight-${slide.highlight.id}`, 5, "festival", "festivalDrop", {
          pads: 0.2,
          kick: 0.95,
          hats: 0.62,
          snare: 0.7,
          bass: 1,
          arp: 0.7,
          lead: 1,
        }, 11_500, 3_400);
      }
      return scene(`highlight-${slide.highlight.id}`, 3, "techHouse", "sparkHouse", {
        pads: 0.16,
        kick: 0.84,
        hats: 0.52,
        snare: 0.48,
        bass: 1,
        arp: 0.55,
        lead: 0.62,
      }, 6_200, 3_800);
    default:
      return scene("default", 2, "house", "languageHouse", {
        pads: 0.28,
        kick: 0.78,
        hats: 0.44,
        snare: 0.4,
        bass: 0.95,
        arp: 0.5,
        lead: 0.42,
      }, 5_000, 4_000);
  }
}

export type SfxHint = "whoosh" | "sweep" | "rise" | "air" | "crash";

export type MusicCue =
  | "build"
  | "metric"
  | "record"
  | "lift"
  | "impact"
  | "celebrate"
  | "finale";

export const MUSIC_BUILD_LEAD_MS = 480;

export function transitionForScene(sceneId: string, intensity: Intensity): SfxHint {
  if (intensity >= 5) return "rise";
  if (intensity >= 4) return "rise";
  if (sceneId === "heatmap") return "sweep";
  if (sceneId === "summary") return "air";
  if (intensity <= 1) return "air";
  return "whoosh";
}
