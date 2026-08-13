export const STATIC_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "pt",
  "it",
  "ja",
  "zh",
  "ko",
  "ar",
] as const;

export type StaticLocale = (typeof STATIC_LOCALES)[number];
export type Locale = StaticLocale;

export function normalizeLocale(code: string): string {
  return code.trim().toLowerCase();
}

export function isStaticLocale(code: string): code is StaticLocale {
  const normalized = normalizeLocale(code);
  return STATIC_LOCALES.includes(normalized as StaticLocale);
}

export function resolveLocale(code: string): Locale {
  const normalized = normalizeLocale(code);
  if (isStaticLocale(normalized)) return normalized;
  return "en";
}
