"use client";

import { useEffect } from "react";
import { useApp } from "@/providers/app-provider";
import type { TranslationView } from "@/lib/i18n/translation-views";

export function useViewI18n(view: TranslationView) {
  const { preloadView, viewReady, localeLoading } = useApp();

  useEffect(() => {
    void preloadView(view);
  }, [view, preloadView]);

  return {
    ready: viewReady(view),
    loading: localeLoading && !viewReady(view),
  };
}
