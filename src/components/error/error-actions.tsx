"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { ErrorActionId } from "@/lib/errors/catalog";

export type ErrorAction = {
  id: ErrorActionId;
  label: string;
};

function ActionButton({
  action,
  variant,
  onRetry,
  signInCallbackUrl,
}: {
  action: ErrorAction;
  variant: "primary" | "secondary";
  onRetry?: () => void;
  signInCallbackUrl?: string;
}) {
  const router = useRouter();
  const className =
    variant === "primary"
      ? "btn-primary btn-primary-glow inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 py-3 font-display text-sm font-bold text-white transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 sm:w-auto"
      : "glass-pill inline-flex min-h-11 w-full items-center justify-center px-6 py-3 font-display text-sm font-bold text-on-surface transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto";

  if (action.id === "home") {
    return (
      <Link href="/" className={className}>
        {action.label}
      </Link>
    );
  }

  const onClick = () => {
    if (action.id === "back") {
      if (window.history.length > 1) router.back();
      else router.push("/");
      return;
    }
    if (action.id === "signin") {
      void signIn("github", { callbackUrl: signInCallbackUrl ?? "/" });
      return;
    }
    if (action.id === "retry") {
      if (onRetry) onRetry();
      else router.refresh();
      return;
    }
    window.location.reload();
  };

  return (
    <button type="button" onClick={onClick} className={className}>
      {action.label}
    </button>
  );
}

export function ErrorActions({
  primary,
  secondary,
  onRetry,
  signInCallbackUrl,
}: {
  primary?: ErrorAction | null;
  secondary?: ErrorAction | null;
  onRetry?: () => void;
  signInCallbackUrl?: string;
}) {
  if (!primary && !secondary) return null;

  return (
    <div className="mt-7 flex w-full max-w-sm flex-col items-center gap-3 sm:flex-row sm:justify-center">
      {primary ? (
        <ActionButton
          action={primary}
          variant="primary"
          onRetry={onRetry}
          signInCallbackUrl={signInCallbackUrl}
        />
      ) : null}
      {secondary ? (
        <ActionButton
          action={secondary}
          variant="secondary"
          onRetry={onRetry}
          signInCallbackUrl={signInCallbackUrl}
        />
      ) : null}
    </div>
  );
}
