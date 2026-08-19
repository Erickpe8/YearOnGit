"use client";

import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";
import { useApp } from "@/providers/app-provider";

export function DataUnavailableFallback({
  titleKey = "dataUnavailableTitle",
  descriptionKey = "dataUnavailableDescription",
}: {
  titleKey?: "dataUnavailableTitle";
  descriptionKey?: "dataUnavailableDescription";
}) {
  const { t } = useApp();

  return (
    <div className="flex max-w-md flex-col items-center gap-2 px-4 text-center">
      <p className="i18n-text font-display text-lg font-bold text-on-surface">
        {t(titleKey)}
      </p>
      <p className="i18n-text text-sm text-on-surface-variant">
        {t(descriptionKey)}
      </p>
    </div>
  );
}

export function DataUnavailableSlide() {
  const { t } = useApp();

  return (
    <WrappedSlideShell slideKey="data-unavailable">
      <h2 className="i18n-text wrapped-slide-title font-display font-bold">
        {t("dataUnavailableTitle")}
      </h2>
      <p className="i18n-text max-w-md text-center text-sm text-on-surface-variant">
        {t("dataUnavailableDescription")}
      </p>
    </WrappedSlideShell>
  );
}
