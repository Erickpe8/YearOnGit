import type { TranslationKey } from "@/lib/i18n/translations";
import { translations } from "@/lib/i18n/translations";
import type { TranslationView } from "@/lib/i18n/translation-views";
import { getViewKeys } from "@/lib/i18n/translation-views";

const CACHE_VERSION = "v4";
const CACHE_PREFIX = `yearongit-i18n-${CACHE_VERSION}`;

export type TranslationBundle = Partial<Record<TranslationKey, string>>;

export function getCacheKey(locale: string, view: TranslationView): string {
  return `${CACHE_PREFIX}:${locale}:${view}`;
}

export function readViewBundle(
  locale: string,
  view: TranslationView,
): TranslationBundle | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getCacheKey(locale, view));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as TranslationBundle;
    const firstKey = getViewKeys(view)[0];
    const english = translations.en[firstKey];
    const cached = parsed[firstKey];

    if (!cached || cached === english) {
      localStorage.removeItem(getCacheKey(locale, view));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeViewBundle(
  locale: string,
  view: TranslationView,
  bundle: TranslationBundle,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getCacheKey(locale, view), JSON.stringify(bundle));
}

export function pickViewBundle(
  view: TranslationView,
  bundle: TranslationBundle,
): TranslationBundle {
  const picked: TranslationBundle = {};
  for (const key of getViewKeys(view)) {
    if (bundle[key]) picked[key] = bundle[key];
  }
  return picked;
}
