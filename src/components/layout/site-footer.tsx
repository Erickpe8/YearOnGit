"use client";

import Link from "next/link";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { useApp } from "@/providers/app-provider";
import { useConsent } from "@/providers/consent-provider";

const GITHUB_URL = "https://github.com/Erickpe8";

type SiteFooterProps = {
  compact?: boolean;
  showLinks?: boolean;
};

export function SiteFooter({ compact = false, showLinks = true }: SiteFooterProps) {
  const { t } = useApp();
  const { openPreferences } = useConsent();

  return (
    <footer
      className={`relative z-10 w-full border-t border-outline-variant/5 px-4 max-[390px]:px-3 md:px-16 ${
        compact ? "py-3 max-[390px]:py-2.5" : "py-5 max-[390px]:py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-1.5 sm:items-start sm:gap-2">
          <BrandWordmark size="sm" className="opacity-90" />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="i18n-text font-display text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary max-[390px]:text-xs"
          >
            {t("builtBy")}
          </a>
          <p className="text-xs text-on-surface-variant/50 max-[390px]:text-[11px]">
            {t("copyright")}
          </p>
        </div>

        {showLinks && (
          <div className="flex flex-wrap items-center justify-center gap-4 max-[390px]:gap-3 sm:justify-end sm:gap-6">
            <Link
              href="/how-it-works"
              className="i18n-label font-display text-xs font-bold uppercase text-on-surface-variant transition-colors hover:text-primary"
            >
              {t("landingHowTitle")}
            </Link>
            <Link
              href="/faq"
              className="i18n-label font-display text-xs font-bold uppercase text-on-surface-variant transition-colors hover:text-primary"
            >
              {t("landingFaqTitle")}
            </Link>
            <Link
              href="/privacy"
              className="i18n-label font-display text-xs font-bold uppercase text-on-surface-variant transition-colors hover:text-primary"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/terms"
              className="i18n-label font-display text-xs font-bold uppercase text-on-surface-variant transition-colors hover:text-primary"
            >
              {t("terms")}
            </Link>
            <button
              type="button"
              onClick={openPreferences}
              className="i18n-label font-display text-xs font-bold uppercase text-on-surface-variant transition-colors hover:text-primary"
            >
              {t("cookieSettings")}
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
