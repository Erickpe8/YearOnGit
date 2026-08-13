"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type TranslationKey,
  translations,
} from "@/lib/i18n/translations";
import { interpolate } from "@/lib/i18n/interpolate";
import {
  isStaticLocale,
  resolveLocale,
  type Locale,
} from "@/lib/i18n/supported-locales";
import {
  readViewBundle,
  writeViewBundle,
  type TranslationBundle,
} from "@/lib/i18n/translation-cache";
import type { TranslationView } from "@/lib/i18n/translation-views";

type HeaderProgress = {
  current: number;
  total: number;
  cycleKey: string;
  settleMs: number;
  dwellMs: number;
  fillMode: "animate" | "complete";
  paused?: boolean;
} | null;

type TranslationValues = Record<string, string | number>;

type AppContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  localeLoading: boolean;
  preloadView: (view: TranslationView) => Promise<void>;
  viewReady: (view: TranslationView) => boolean;
  headerVisible: boolean;
  toggleHeader: () => void;
  showHeader: () => void;
  hideHeader: () => void;
  headerProgress: HeaderProgress;
  setHeaderProgress: (progress: HeaderProgress) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const LOCALE_KEY = "yearongit-locale";
const HEADER_KEY = "yearongit-header-visible";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dynamicTranslations, setDynamicTranslations] = useState<TranslationBundle>({});
  const [readyViews, setReadyViews] = useState<Set<string>>(new Set());
  const [localeLoading, setLocaleLoading] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerProgress, setHeaderProgress] = useState<HeaderProgress>(null);
  const memoryCacheRef = useRef<Map<string, TranslationBundle>>(new Map());
  const inflightRef = useRef<Map<string, Promise<void>>>(new Map());

  const viewCacheKey = useCallback(
    (view: TranslationView) => `${locale}:${view}`,
    [locale],
  );

  const applyDocumentLocale = useCallback((next: Locale, bundle?: TranslationBundle) => {
    document.documentElement.lang = next;

    const title = isStaticLocale(next)
      ? translations[next].metadataTitle
      : bundle?.metadataTitle ?? dynamicTranslations.metadataTitle ?? translations.en.metadataTitle;
    document.title = title;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      const description = isStaticLocale(next)
        ? translations[next].metadataDescription
        : bundle?.metadataDescription ??
          dynamicTranslations.metadataDescription ??
          translations.en.metadataDescription;
      meta.setAttribute("content", description);
    }
  }, [dynamicTranslations.metadataDescription, dynamicTranslations.metadataTitle]);

  const mergeBundle = useCallback((bundle: TranslationBundle) => {
    setDynamicTranslations((prev) => ({ ...prev, ...bundle }));
  }, []);

  const markViewReady = useCallback((view: TranslationView) => {
    setReadyViews((prev) => {
      const key = viewCacheKey(view);
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, [viewCacheKey]);

  const preloadView = useCallback(
    async (view: TranslationView) => {
      const cacheKey = viewCacheKey(view);

      if (isStaticLocale(locale)) {
        markViewReady(view);
        return;
      }

      const memoryBundle = memoryCacheRef.current.get(cacheKey);
      if (memoryBundle) {
        mergeBundle(memoryBundle);
        markViewReady(view);
        return;
      }

      const cached = readViewBundle(locale, view);
      if (cached) {
        memoryCacheRef.current.set(cacheKey, cached);
        mergeBundle(cached);
        markViewReady(view);
        return;
      }

      const inflight = inflightRef.current.get(cacheKey);
      if (inflight) {
        await inflight;
        return;
      }

      const request = (async () => {
        setLocaleLoading(true);
        try {
          const response = await fetch(
            `/api/translate-ui?locale=${encodeURIComponent(locale)}&view=${encodeURIComponent(view)}`,
          );
          if (!response.ok) throw new Error("Translation request failed");

          const bundle = (await response.json()) as TranslationBundle;
          const firstKey = Object.keys(bundle)[0] as TranslationKey | undefined;
          const translated =
            firstKey && bundle[firstKey] !== translations.en[firstKey];

          if (translated) {
            memoryCacheRef.current.set(cacheKey, bundle);
            writeViewBundle(locale, view, bundle);
            mergeBundle(bundle);
          }
        } finally {
          markViewReady(view);
          setLocaleLoading(false);
          inflightRef.current.delete(cacheKey);
        }
      })();

      inflightRef.current.set(cacheKey, request);
      await request;
    },
    [locale, viewCacheKey, markViewReady, mergeBundle],
  );

  const viewReady = useCallback(
    (view: TranslationView) => {
      if (isStaticLocale(locale)) return true;
      return readyViews.has(viewCacheKey(view));
    },
    [locale, readyViews, viewCacheKey],
  );

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_KEY);
    const storedHeader = localStorage.getItem(HEADER_KEY);

    if (storedLocale) {
      const resolved = resolveLocale(storedLocale);
      setLocaleState(resolved);
      document.documentElement.lang = resolved;
    }

    if (storedHeader === "false") {
      setHeaderVisible(false);
    }
  }, []);

  useEffect(() => {
    memoryCacheRef.current.clear();
    inflightRef.current.clear();
    setReadyViews(new Set());
    setDynamicTranslations({});

    if (isStaticLocale(locale)) {
      setLocaleLoading(false);
      applyDocumentLocale(locale);
      return;
    }

    applyDocumentLocale(locale);
    void preloadView("common");
  }, [locale, applyDocumentLocale, preloadView]);

  const setLocale = useCallback((next: Locale) => {
    const resolved = resolveLocale(next);
    setLocaleState(resolved);
    localStorage.setItem(LOCALE_KEY, resolved);
    document.documentElement.lang = resolved;
  }, []);

  const toggleHeader = useCallback(() => {
    setHeaderVisible((prev) => {
      const next = !prev;
      localStorage.setItem(HEADER_KEY, String(next));
      return next;
    });
  }, []);

  const showHeader = useCallback(() => {
    setHeaderVisible(true);
    localStorage.setItem(HEADER_KEY, "true");
  }, []);

  const hideHeader = useCallback(() => {
    setHeaderVisible(false);
    localStorage.setItem(HEADER_KEY, "false");
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) => {
      const template = isStaticLocale(locale)
        ? translations[locale][key]
        : (dynamicTranslations[key] ?? translations.en[key]);

      return values ? interpolate(template, values) : template;
    },
    [locale, dynamicTranslations],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      localeLoading,
      preloadView,
      viewReady,
      headerVisible,
      toggleHeader,
      showHeader,
      hideHeader,
      headerProgress,
      setHeaderProgress,
    }),
    [
      locale,
      setLocale,
      t,
      localeLoading,
      preloadView,
      viewReady,
      headerVisible,
      toggleHeader,
      showHeader,
      hideHeader,
      headerProgress,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
