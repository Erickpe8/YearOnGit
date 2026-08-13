import type { LanguageOption } from "@/lib/i18n/language-types";
import { STATIC_LOCALES } from "@/lib/i18n/supported-locales";

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

export const POPULAR_LANGUAGE_CODES = STATIC_LOCALES;

export async function loadLanguages(): Promise<LanguageOption[]> {
  return SUPPORTED_LANGUAGES;
}

export function filterLanguages(
  languages: LanguageOption[],
  query: string,
): LanguageOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return languages;

  return languages.filter(
    (language) =>
      language.code.toLowerCase().includes(normalized) ||
      language.name.toLowerCase().includes(normalized) ||
      language.nativeName.toLowerCase().includes(normalized),
  );
}

export function sortLanguages(languages: LanguageOption[]): LanguageOption[] {
  const order = POPULAR_LANGUAGE_CODES as readonly string[];

  return [...languages].sort((a, b) => {
    const aIndex = order.indexOf(a.code);
    const bIndex = order.indexOf(b.code);
    return aIndex - bIndex;
  });
}
