"use client";

import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";
import { useApp } from "@/providers/app-provider";

export function SlideErrorFallback({
  onContinue,
  onRetry,
}: {
  onContinue: () => void;
  onRetry?: () => void;
}) {
  const { t } = useApp();

  return (
    <WrappedSlideShell slideKey="slide-error">
      <h2 className="i18n-text wrapped-slide-title shrink-0 font-display font-bold text-primary">
        {t("slideErrorTitle")}
      </h2>
      <p className="i18n-text max-w-md text-center text-sm text-on-surface-variant md:text-base">
        {t("slideErrorDescription")}
      </p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="i18n-cta btn-primary w-full rounded-full py-3 font-display text-sm font-bold text-white"
        >
          {t("slideErrorContinue")}
        </button>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="i18n-cta glass-pill w-full py-3 font-display text-sm font-bold text-on-surface"
          >
            {t("errorTryAgain")}
          </button>
        ) : null}
      </div>
    </WrappedSlideShell>
  );
}
