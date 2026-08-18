"use client";

import { useCallback, useState } from "react";
import { ensureShareSlug } from "@/lib/wrapped/ensure-share-client";
import type { WrappedPayload } from "@/lib/wrapped/types";
import { useApp } from "@/providers/app-provider";

type ShareCopyButtonProps = {
  payload: WrappedPayload;
  className?: string;
};

type ShareState = "idle" | "loading" | "copied" | "error";

export function ShareCopyButton({
  payload,
  className = "",
}: ShareCopyButtonProps) {
  const { t } = useApp();
  const [state, setState] = useState<ShareState>("idle");

  const handleShare = useCallback(async () => {
    if (state === "loading") return;
    setState("loading");

    try {
      const { url: shareUrl } = await ensureShareSlug(payload);
      const title = `@${payload.username}'s Year on Git ${payload.year}`;
      const text = t("shareNativeText", {
        username: payload.username,
        year: payload.year,
      });

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({ title, text, url: shareUrl });
          setState("copied");
          window.setTimeout(() => setState("idle"), 2200);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setState("idle");
            return;
          }
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2500);
    }
  }, [payload, state, t]);

  const label =
    state === "copied"
      ? t("linkCopied")
      : state === "loading"
        ? t("creatingLink")
        : state === "error"
          ? t("shareLinkError")
          : t("copyLink");

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      disabled={state === "loading"}
      aria-label={t("copyLink")}
      aria-live="polite"
      className={`i18n-cta glass-pill w-full py-2.5 font-display text-sm font-bold transition-colors md:py-3 ${
        state === "copied"
          ? "text-primary"
          : state === "error"
            ? "text-red-400"
            : "text-on-surface hover:text-primary active:scale-[0.98]"
      } disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {label}
    </button>
  );
}
