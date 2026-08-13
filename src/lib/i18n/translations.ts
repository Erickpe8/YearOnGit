import { ar } from "@/lib/i18n/locales/ar";
import { de } from "@/lib/i18n/locales/de";
import { en } from "@/lib/i18n/locales/en";
import { es } from "@/lib/i18n/locales/es";
import { fr } from "@/lib/i18n/locales/fr";
import { it } from "@/lib/i18n/locales/it";
import { ja } from "@/lib/i18n/locales/ja";
import { ko } from "@/lib/i18n/locales/ko";
import { pt } from "@/lib/i18n/locales/pt";
import { zh } from "@/lib/i18n/locales/zh";

export const translations = {
  en,
  es,
  fr,
  de,
  pt,
  it,
  ja,
  zh,
  ko,
  ar,
} as const;

export type TranslationKey = keyof typeof en;
