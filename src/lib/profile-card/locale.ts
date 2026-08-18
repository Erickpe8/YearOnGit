import { resolveLocale, type Locale } from "@/lib/i18n/supported-locales";

export const PROFILE_CARD_LANG_PARAM = "lang";

export function parseProfileCardLocale(
  raw: string | null | undefined,
): Locale {
  if (!raw || !raw.trim()) return "en";
  return resolveLocale(raw);
}

export function profileCardLangSearch(locale: string): string {
  return `${PROFILE_CARD_LANG_PARAM}=${parseProfileCardLocale(locale)}`;
}
