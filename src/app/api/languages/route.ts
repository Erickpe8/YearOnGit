import { NextRequest, NextResponse } from "next/server";
import type { LanguageOption } from "@/lib/i18n/language-types";

type LibreTranslateLanguage = {
  code: string;
  name: string;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const LIBRETRANSLATE_URL = "https://libretranslate.com/languages";

const FALLBACK_LANGUAGES: LanguageOption[] = [
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

let cachedLanguages: LanguageOption[] | null = null;
let cacheExpiresAt = 0;

function getNativeName(code: string, fallback: string): string {
  try {
    const english = new Intl.DisplayNames(["en"], { type: "language" }).of(code);
    const native = new Intl.DisplayNames([code], { type: "language" }).of(code);
    if (native && native !== english) return native;
  } catch {
    // ignore invalid locale codes
  }
  return fallback;
}

function normalizeLanguages(languages: LibreTranslateLanguage[]): LanguageOption[] {
  const unique = new Map<string, LanguageOption>();

  for (const language of languages) {
    if (!language.code || unique.has(language.code)) continue;
    unique.set(language.code, {
      code: language.code,
      name: language.name,
      nativeName: getNativeName(language.code, language.name),
    });
  }

  return Array.from(unique.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function getIntlLanguages(): LanguageOption[] {
  try {
    const supportedValuesOf = (
      Intl as typeof Intl & {
        supportedValuesOf?: (key: "language") => string[];
      }
    ).supportedValuesOf;

    if (!supportedValuesOf) return [];

    return supportedValuesOf("language")
      .filter((code) => !code.includes("-"))
      .map((code) => {
        const english =
          new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
        return {
          code,
          name: english,
          nativeName: getNativeName(code, english),
        };
      });
  } catch {
    return [];
  }
}

function mergeLanguageLists(...lists: LanguageOption[][]): LanguageOption[] {
  const unique = new Map<string, LanguageOption>();
  for (const list of lists) {
    for (const language of list) {
      if (!language.code || unique.has(language.code)) continue;
      unique.set(language.code, language);
    }
  }
  return Array.from(unique.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

async function fetchLanguages(): Promise<LanguageOption[]> {
  const now = Date.now();
  if (cachedLanguages && now < cacheExpiresAt) {
    return cachedLanguages;
  }

  try {
    const response = await fetch(LIBRETRANSLATE_URL, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate responded with ${response.status}`);
    }

    const data = (await response.json()) as LibreTranslateLanguage[];
    const normalized = normalizeLanguages(data);
    cachedLanguages =
      normalized.length > 0
        ? mergeLanguageLists(normalized, getIntlLanguages())
        : FALLBACK_LANGUAGES;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return cachedLanguages;
  } catch {
    cachedLanguages = FALLBACK_LANGUAGES;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return cachedLanguages;
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const languages = await fetchLanguages();

  const filtered = query
    ? languages.filter(
        (language) =>
          language.code.toLowerCase().includes(query) ||
          language.name.toLowerCase().includes(query) ||
          language.nativeName.toLowerCase().includes(query),
      )
    : languages;

  return NextResponse.json(filtered);
}
