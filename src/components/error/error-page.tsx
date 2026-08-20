"use client";

import type { ReactNode } from "react";
import { ErrorActions, type ErrorAction } from "@/components/error/error-actions";
import { ErrorCode } from "@/components/error/error-code";
import { ErrorContent } from "@/components/error/error-content";
import { ErrorFooter } from "@/components/error/error-footer";
import { ErrorIllustration } from "@/components/error/error-illustration";
import type { ErrorActionId, ErrorMood } from "@/lib/errors/catalog";

export type ErrorPageProps = {
  statusCode: string | number;
  title: string;
  description: string;
  mood?: ErrorMood;
  icon?: ReactNode;
  primaryAction?: ErrorAction | ErrorActionId | null;
  secondaryAction?: ErrorAction | ErrorActionId | null;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  actionLabels?: Partial<Record<ErrorActionId, string>>;
  availability?: string | null;
  footerLabel?: string;
  onRetry?: () => void;
  requestId?: string | null;
  referenceLabel?: string;
  signInCallbackUrl?: string;
};

function resolveAction(
  action: ErrorAction | ErrorActionId | null | undefined,
  labels: Partial<Record<ErrorActionId, string>>,
): ErrorAction | null {
  if (!action) return null;
  if (typeof action !== "string") return action;
  const label = labels[action];
  if (!label) return null;
  return { id: action, label };
}

export function ErrorPage({
  statusCode,
  title,
  description,
  mood = "broken",
  icon,
  primaryAction,
  secondaryAction,
  showHomeButton = false,
  showBackButton = false,
  actionLabels = {},
  availability,
  footerLabel,
  onRetry,
  requestId,
  referenceLabel,
  signInCallbackUrl,
}: ErrorPageProps) {
  let primary = resolveAction(primaryAction, actionLabels);
  let secondary = resolveAction(secondaryAction, actionLabels);

  if (showHomeButton && primary?.id !== "home" && secondary?.id !== "home") {
    const home = resolveAction("home", actionLabels);
    if (!primary) primary = home;
    else if (!secondary) secondary = home;
  }

  if (showBackButton && primary?.id !== "back" && secondary?.id !== "back") {
    const back = resolveAction("back", actionLabels);
    if (!secondary) secondary = back;
  }

  return (
    <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 text-center max-[390px]:px-3">
      <div className="glass-card w-full max-w-lg rounded-3xl px-6 py-6 max-[390px]:px-5 max-[390px]:py-5 md:px-8 md:py-7">
        {icon ?? <ErrorIllustration mood={mood} emphasized={Number(statusCode) === 500} />}
        <div className="mt-3">
          <ErrorCode code={statusCode} />
        </div>
        <div className="mt-3">
          <ErrorContent
            title={title}
            description={description}
            availability={availability}
            requestId={requestId}
            referenceLabel={referenceLabel}
          />
        </div>
        <ErrorActions
          primary={primary}
          secondary={secondary}
          onRetry={onRetry}
          signInCallbackUrl={signInCallbackUrl}
        />
        {footerLabel ? <ErrorFooter label={footerLabel} /> : null}
      </div>
    </main>
  );
}
