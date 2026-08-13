"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LocaleFlag } from "@/components/i18n/locale-flag";
import { IconCheck, IconSearch } from "@/components/ui/icons";
import {
  filterLanguages,
  SUPPORTED_LANGUAGES,
  sortLanguages,
} from "@/lib/i18n/language-cache";
import { resolveLocale, type Locale } from "@/lib/i18n/supported-locales";
import { useApp } from "@/providers/app-provider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

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

  const visibleLanguages = useMemo(
    () => sortLanguages(filterLanguages(SUPPORTED_LANGUAGES, query)),
    [query],
  );

  const handleSelect = (code: string) => {
    setLocale(resolveLocale(code) as Locale);
    setOpen(false);
  };

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
        <LocaleFlag locale={locale} />
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
            {visibleLanguages.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-on-surface-variant">
                {t("noLanguagesFound")}
              </li>
            ) : (
              visibleLanguages.map((language) => {
                const selected = locale === language.code;

                return (
                  <li key={language.code} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(language.code)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                        selected
                          ? "bg-primary/15 text-primary"
                          : "text-on-surface hover:bg-white/5"
                      }`}
                    >
                      <LocaleFlag locale={language.code} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-xs font-semibold">
                          {language.nativeName}
                        </span>
                        <span className="block truncate text-[10px] text-on-surface-variant">
                          {language.name} / {language.code.toUpperCase()}
                        </span>
                      </span>
                      {selected ? (
                        <IconCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-white/8 px-3 py-2">
            <p className="text-[10px] text-on-surface-variant">
              {SUPPORTED_LANGUAGES.length} {t("languagesCount")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
