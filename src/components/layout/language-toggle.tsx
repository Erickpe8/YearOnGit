"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { IconGlobe, IconLoader, IconSearch } from "@/components/ui/icons";
import type { LanguageOption } from "@/lib/i18n/language-types";
import { useApp } from "@/providers/app-provider";

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

const POPULAR_CODES = ["en", "es", "fr", "de", "pt", "it", "ja", "zh", "ko", "ar"];

export function LanguageToggle() {
  const { locale, setLocale, t, localeLoading } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const fetchLanguages = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const response = await fetch(`/api/languages${params}`);
      if (!response.ok) throw new Error("Failed to fetch languages");
      const data = (await response.json()) as LanguageOption[];
      setLanguages(data.length > 0 ? data : FALLBACK_LANGUAGES);
    } catch {
      setLanguages(FALLBACK_LANGUAGES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void fetchLanguages(query);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open, query, fetchLanguages]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = (code: string) => {
    setLocale(code.toLowerCase());
    setOpen(false);
  };

  const sortedLanguages = [...languages].sort((a, b) => {
    const aPopular = POPULAR_CODES.indexOf(a.code);
    const bPopular = POPULAR_CODES.indexOf(b.code);
    if (aPopular !== -1 || bPopular !== -1) {
      if (aPopular === -1) return 1;
      if (bPopular === -1) return -1;
      return aPopular - bPopular;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={t("selectLanguage")}
        className={`glass-pill flex h-9 items-center gap-1.5 px-2.5 transition-colors max-[390px]:h-8 max-[390px]:px-2 ${
          open ? "text-primary" : "text-on-surface-variant hover:text-primary"
        }`}
      >
        {localeLoading ? (
          <IconLoader className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <IconGlobe className="h-4 w-4 shrink-0" />
        )}
        <span className="i18n-label font-display text-[10px] font-bold uppercase">
          {locale}
        </span>
      </button>

      {open ? (
        <div className="glass-panel absolute right-0 top-[calc(100%+8px)] z-[60] w-64 overflow-hidden rounded-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.45)] max-[390px]:w-[min(16rem,calc(100vw-2rem))]">
          <div className="border-b border-white/8 p-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-2">
              <IconSearch className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchLanguage")}
                className="w-full bg-transparent font-body text-xs text-on-surface outline-none placeholder:text-on-surface-variant/70"
              />
            </div>
          </div>

          <ul
            id={listboxId}
            role="listbox"
            aria-label={t("language")}
            className="max-h-64 overflow-y-auto p-1.5"
          >
            {loading ? (
              <li className="flex items-center justify-center gap-2 px-3 py-6 text-on-surface-variant">
                <IconLoader className="h-4 w-4 animate-spin" />
              </li>
            ) : sortedLanguages.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-on-surface-variant">
                {t("noLanguagesFound")}
              </li>
            ) : (
              sortedLanguages.map((language) => {
                const selected = locale === language.code;

                return (
                  <li key={language.code} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(language.code)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition-colors ${
                        selected
                          ? "bg-primary/15 text-primary"
                          : "text-on-surface hover:bg-white/5"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-display text-xs font-semibold">
                          {language.nativeName}
                        </span>
                        <span className="block truncate text-[10px] text-on-surface-variant">
                          {language.name} · {language.code.toUpperCase()}
                        </span>
                      </span>
                      {selected ? (
                        <span className="shrink-0 text-[10px] font-bold text-primary">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-white/8 px-3 py-2">
            <p className="text-[10px] text-on-surface-variant">
              {localeLoading
                ? locale === "es"
                  ? "Traduciendo..."
                  : "Translating..."
                : `${languages.length} ${t("languagesCount")}`}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
