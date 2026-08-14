"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type TranslationKey,
  translations,
} from "@/lib/i18n/translations";
import { interpolate } from "@/lib/i18n/interpolate";
import {
  resolveLocale,
  type Locale,
} from "@/lib/i18n/supported-locales";
import { brandName } from "@/lib/brand/assets";
import { SfxProvider } from "@/providers/sfx-provider";

type HeaderProgress = {
  current: number;
  total: number;
  cycleKey: string;
  settleMs: number;
  dwellMs: number;
  durationMs: number;
  fillMode: "animate" | "complete";
  paused?: boolean;
} | null;

type TranslationValues = Record<string, string | number>;

type AppContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  localeLoading: boolean;
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
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerProgress, setHeaderProgress] = useState<HeaderProgress>(null);

  const applyDocumentLocale = useCallback((next: Locale) => {
    document.documentElement.lang = next;
    document.title = brandName;

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", translations[next].metadataDescription);
    }
  }, []);

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_KEY);
    const storedHeader = localStorage.getItem(HEADER_KEY);

    if (storedLocale) {
      const resolved = resolveLocale(storedLocale);
      setLocaleState(resolved);
      document.documentElement.lang = resolved;
      if (resolved !== storedLocale) {
        localStorage.setItem(LOCALE_KEY, resolved);
      }
    }

    if (storedHeader === "false") {
      setHeaderVisible(false);
    }
  }, []);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale, applyDocumentLocale]);

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
      const template =
        translations[locale][key] ?? translations.en[key];
      return values ? interpolate(template, values) : template;
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      localeLoading: false,
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
      headerVisible,
      toggleHeader,
      showHeader,
      hideHeader,
      headerProgress,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      <SfxProvider>{children}</SfxProvider>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
