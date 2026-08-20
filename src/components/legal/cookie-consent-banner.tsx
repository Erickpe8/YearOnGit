"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { IconLock } from "@/components/ui/icons";
import { useConsent } from "@/providers/consent-provider";
import { useApp } from "@/providers/app-provider";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";

const ACTION_BTN =
  "inline-flex h-10 min-h-10 items-center justify-center rounded-full px-5 font-display text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

function CookieToggle({
  id,
  label,
  description,
  checked,
  disabled,
  locked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  locked?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#161b22] px-3.5 py-3 ${
        disabled ? "cursor-not-allowed opacity-55" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className={`i18n-text flex items-center gap-1.5 font-display text-sm font-bold text-on-surface ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {locked ? (
            <IconLock className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" />
          ) : null}
          {label}
        </label>
        <p className="i18n-text mt-1 text-xs leading-relaxed text-on-surface-variant">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onChange?.(!checked);
        }}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
          checked ? "bg-primary" : "bg-white/15"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function CookieConsentBanner() {
  const { t } = useApp();
  useViewI18n("consent");
  const {
    ready,
    decided,
    acceptAll,
    rejectNonEssential,
    saveCustom,
    openPreferences,
    preferencesOpen,
    closePreferences,
    consent,
  } = useConsent();
  const baseId = useId();
  const [analytics, setAnalytics] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (preferencesOpen) {
      setAnalytics(consent.analytics);
      setPreferences(consent.preferences);
    }
  }, [preferencesOpen, consent.analytics, consent.preferences]);

  useEffect(() => {
    if (!mounted || !ready) return;
    if (decided && !preferencesOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted, ready, decided, preferencesOpen]);

  if (!mounted || !ready) return null;
  if (decided && !preferencesOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] isolate flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t("cookieBack")}
        className="absolute inset-0 bg-black/80 backdrop-blur-[8px] [-webkit-backdrop-filter:blur(8px)]"
        onClick={() => {
          if (preferencesOpen && decided) closePreferences();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-desc"
        className="relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0d1117] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)]"
      >
        <div className="overflow-y-auto bg-[#0d1117] px-4 py-4 md:px-5 md:py-5">
          <h2
            id="cookie-consent-title"
            className="i18n-text font-display text-base font-bold text-on-surface md:text-lg"
          >
            {t("cookieBannerTitle")}
          </h2>
          <p
            id="cookie-consent-desc"
            className="i18n-text mt-2 text-sm leading-relaxed text-on-surface-variant"
          >
            {t("cookieBannerBody")}{" "}
            <Link
              href="/privacy"
              className="font-semibold text-primary underline underline-offset-2 decoration-primary/50 transition-colors hover:text-primary hover:decoration-primary"
            >
              {t("privacy")}
            </Link>
            .
          </p>

          {preferencesOpen ? (
            <div className="mt-4 flex flex-col gap-3 pb-1">
              <CookieToggle
                id={`${baseId}-essential`}
                label={t("cookieEssential")}
                description={t("cookieEssentialDesc")}
                checked
                disabled
                locked
              />
              <CookieToggle
                id={`${baseId}-analytics`}
                label={t("cookieAnalytics")}
                description={t("cookieAnalyticsDesc")}
                checked={analytics}
                onChange={setAnalytics}
              />
              <CookieToggle
                id={`${baseId}-preferences`}
                label={t("cookiePreferences")}
                description={t("cookiePreferencesDesc")}
                checked={preferences}
                onChange={setPreferences}
              />
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#010409] px-4 pt-4 pb-3.5 md:px-5 md:pt-4 md:pb-4">
          {preferencesOpen ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePreferences}
                className={`${ACTION_BTN} border border-white/15 bg-transparent text-on-surface hover:bg-white/5`}
              >
                {t("cookieBack")}
              </button>
              <button
                type="button"
                onClick={() => saveCustom({ analytics, preferences })}
                className={`${ACTION_BTN} btn-primary text-white`}
              >
                {t("cookieSaveChoices")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={openPreferences}
                className={`${ACTION_BTN} border border-white/15 bg-transparent text-on-surface-variant hover:bg-white/5 sm:order-1`}
              >
                {t("cookieCustomize")}
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className={`${ACTION_BTN} border border-white/15 bg-transparent text-on-surface hover:bg-white/5 sm:order-2`}
              >
                {t("cookieRejectNonEssential")}
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className={`${ACTION_BTN} btn-primary text-white sm:order-3`}
              >
                {t("cookieAcceptAll")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
