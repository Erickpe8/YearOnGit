"use client";

import { GlassHeader } from "@/components/layout/glass-header";
import { HeaderRestorePill } from "@/components/layout/header-restore-pill";
import { NoiseOverlay } from "@/components/ui/noise-overlay";
import { ErrorBackground } from "@/components/error/error-background";
import { ErrorPage } from "@/components/error/error-page";
import {
  ACTION_LABEL_KEYS,
  getErrorPage,
  type ErrorActionId,
  type ErrorStatusCode,
} from "@/lib/errors/catalog";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import { useApp } from "@/providers/app-provider";
import type { TranslationKey } from "@/lib/i18n/translations";

export function ErrorScreen({
  code,
  titleKey,
  descriptionKey,
  availability,
  onRetry,
  requestId,
  signInCallbackUrl,
  actionLabels: actionLabelOverrides,
}: {
  code: ErrorStatusCode | number | string;
  titleKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  availability?: string | null;
  onRetry?: () => void;
  requestId?: string | null;
  signInCallbackUrl?: string;
  actionLabels?: Partial<Record<ErrorActionId, string>>;
}) {
  const { t } = useApp();
  useViewI18n("errors");
  const page = getErrorPage(code);
  const actionLabels = {
    home: t(ACTION_LABEL_KEYS.home),
    back: t(ACTION_LABEL_KEYS.back),
    retry: t(ACTION_LABEL_KEYS.retry),
    signin: t(ACTION_LABEL_KEYS.signin),
    reload: t(ACTION_LABEL_KEYS.reload),
    ...actionLabelOverrides,
  } satisfies Record<ErrorActionId, string>;

  const availabilityText = page.showAvailability
    ? (availability ??
      (process.env.NEXT_PUBLIC_STATUS_MESSAGE
        ? t("errorAvailability", {
            status: process.env.NEXT_PUBLIC_STATUS_MESSAGE,
          })
        : null))
    : null;

  return (
    <>
      <GlassHeader />
      <HeaderRestorePill />
      <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden pt-14 md:pt-16">
        <ErrorBackground />
        <ErrorPage
          statusCode={page.statusCode}
          title={t(titleKey ?? page.titleKey)}
          description={t(descriptionKey ?? page.descriptionKey)}
          mood={page.mood}
          primaryAction={page.primaryAction}
          secondaryAction={page.secondaryAction}
          actionLabels={actionLabels}
          availability={availabilityText}
          footerLabel={t("copyright")}
          onRetry={onRetry}
          requestId={requestId}
          referenceLabel={
            requestId ? t("errorReference", { id: requestId }) : undefined
          }
          signInCallbackUrl={signInCallbackUrl}
        />
        <NoiseOverlay />
      </div>
    </>
  );
}
