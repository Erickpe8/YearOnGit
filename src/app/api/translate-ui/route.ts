import { NextRequest, NextResponse } from "next/server";
import { getTranslatedViewBundle } from "@/lib/i18n/translate-ui";
import { isStaticLocale, normalizeLocale } from "@/lib/i18n/supported-locales";
import { translations, type TranslationKey } from "@/lib/i18n/translations";
import {
  type TranslationView,
  TRANSLATION_VIEWS,
  getViewKeys,
} from "@/lib/i18n/translation-views";

function pickStaticView(view: TranslationView, locale: "en" | "es") {
  const picked: Partial<Record<TranslationKey, string>> = {};
  for (const key of getViewKeys(view)) {
    picked[key] = translations[locale][key];
  }
  return picked;
}

export async function GET(request: NextRequest) {
  const locale = normalizeLocale(
    request.nextUrl.searchParams.get("locale") ?? "",
  );
  const view = request.nextUrl.searchParams.get("view") as TranslationView | null;

  if (!locale) {
    return NextResponse.json({ error: "Missing locale" }, { status: 400 });
  }

  if (!view || !(view in TRANSLATION_VIEWS)) {
    return NextResponse.json({ error: "Missing or invalid view" }, { status: 400 });
  }

  if (isStaticLocale(locale)) {
    return NextResponse.json(pickStaticView(view, locale));
  }

  try {
    const bundle = await getTranslatedViewBundle(locale, view);
    return NextResponse.json(bundle);
  } catch {
    const fallback: Partial<Record<TranslationKey, string>> = {};
    for (const key of getViewKeys(view)) {
      fallback[key] = translations.en[key];
    }
    return NextResponse.json(fallback);
  }
}
