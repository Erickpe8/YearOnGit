"use client";

import { useApp } from "@/providers/app-provider";
import type { TranslationView } from "@/lib/i18n/translation-views";

export function useViewI18n(_view: TranslationView) {
  const { localeLoading } = useApp();

  return {
    ready: true,
    loading: localeLoading,
  };
}
