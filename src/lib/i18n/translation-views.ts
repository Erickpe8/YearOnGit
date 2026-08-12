import type { TranslationKey } from "@/lib/i18n/translations";

export const TRANSLATION_VIEWS = {
  common: [
    "hideHeader",
    "showHeader",
    "signOut",
    "headerGreeting",
    "language",
    "searchLanguage",
    "noLanguagesFound",
    "selectLanguage",
    "languagesCount",
    "privacy",
    "terms",
    "builtBy",
    "copyright",
    "metadataTitle",
    "metadataDescription",
  ],
  landing: [
    "taglinePrefix",
    "taglineSuffix",
    "landingDescription",
    "continueWithGitHub",
    "viewMyWrapped",
    "welcomeBack",
    "privacyNote",
    "editionLive",
    "globalImpact",
    "contributions2026",
    "languages",
    "topRepos",
    "commitsThisYear",
    "previewStreak",
  ],
  loading: ["buildingRecap", "gatheringCommits", "welcomeBack"],
  wrapped: [
    "introHey",
    "yearLabel",
    "commitsTitle",
    "commitsLabel",
    "globalImpact",
    "contributions2026",
    "languages",
    "longestStreak",
    "days",
    "topContributors",
    "wrapped26",
    "your2026",
    "shareOnX",
    "copyLink",
    "viewAgain",
  ],
} as const satisfies Record<string, readonly TranslationKey[]>;

export type TranslationView = keyof typeof TRANSLATION_VIEWS;

export const ALL_TRANSLATION_VIEWS = Object.keys(
  TRANSLATION_VIEWS,
) as TranslationView[];

export function getViewKeys(view: TranslationView): TranslationKey[] {
  return [...TRANSLATION_VIEWS[view]];
}
