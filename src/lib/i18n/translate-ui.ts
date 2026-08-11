import { translations, type TranslationKey } from "@/lib/i18n/translations";
import type { TranslationView } from "@/lib/i18n/translation-views";
import { getViewKeys } from "@/lib/i18n/translation-views";

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

type TranslationBundle = Record<TranslationKey, string>;

const translationCache = new Map<
  string,
  { expiresAt: number; bundle: TranslationBundle }
>();

export function toTranslationTarget(locale: string): string {
  const normalized = locale.trim().toLowerCase();
  const map: Record<string, string> = {
    "zh-hans": "zh-CN",
    "zh-hant": "zh-TW",
    "pt-br": "pt-BR",
    "pt-pt": "pt-PT",
  };

  return map[normalized] ?? normalized.split("-")[0];
}

async function translateText(text: string, target: string): Promise<string> {
  if (!text.trim() || target === "en") return text;

  const langpair = `en|${target}`;
  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MyMemory responded with ${response.status}`);
  }

  const data = (await response.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };

  if (data.responseStatus !== 200) {
    throw new Error("MyMemory translation failed");
  }

  const translated = data.responseData?.translatedText?.trim();
  return translated && translated !== text ? translated : text;
}

function isTranslatedBundle(
  bundle: TranslationBundle,
  source: TranslationBundle,
  keys: TranslationKey[],
): boolean {
  const changed = keys.filter((key) => bundle[key] !== source[key]).length;
  return changed >= Math.min(3, Math.floor(keys.length * 0.2));
}

async function translateSequentially(
  entries: [TranslationKey, string][],
  target: string,
): Promise<TranslationBundle> {
  const bundle = { ...translations.en } as TranslationBundle;

  for (const [key, value] of entries) {
    try {
      bundle[key] = await translateText(value, target);
    } catch {
      bundle[key] = value;
    }
  }

  return bundle;
}

export async function getTranslatedViewBundle(
  locale: string,
  view: TranslationView,
): Promise<Partial<Record<TranslationKey, string>>> {
  const target = toTranslationTarget(locale);
  const cacheKey = `${target}:${view}`;
  const cached = translationCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return pickKeys(cached.bundle, getViewKeys(view));
  }

  const keys = getViewKeys(view);
  const entries = keys.map(
    (key) => [key, translations.en[key]] as [TranslationKey, string],
  );
  const fullBundle = await translateSequentially(entries, target);

  if (isTranslatedBundle(fullBundle, translations.en, keys)) {
    translationCache.set(cacheKey, {
      bundle: fullBundle,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  return pickKeys(fullBundle, keys);
}

function pickKeys(
  bundle: TranslationBundle,
  keys: TranslationKey[],
): Partial<Record<TranslationKey, string>> {
  const picked: Partial<Record<TranslationKey, string>> = {};
  for (const key of keys) {
    picked[key] = bundle[key];
  }
  return picked;
}
