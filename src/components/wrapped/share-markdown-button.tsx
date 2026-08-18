"use client";

import { useCallback, useState } from "react";
import { IconCode } from "@/components/ui/icons";
import { ensureProfileCardMarkdown } from "@/lib/profile-card/ensure-client";
import { ensureShareSlug } from "@/lib/wrapped/ensure-share-client";
import type { WrappedPayload } from "@/lib/wrapped/types";
import { useApp } from "@/providers/app-provider";

type ShareMarkdownButtonProps = {
  payload: WrappedPayload;
  className?: string;
};

type CopyState = "idle" | "loading" | "copied" | "error";

export function ShareMarkdownButton({
  payload,
  className = "",
}: ShareMarkdownButtonProps) {
  const { t, locale } = useApp();
  const [state, setState] = useState<CopyState>("idle");

  const handleCopy = useCallback(async () => {
    if (state === "loading") return;
    setState("loading");

    try {
      let shareSlug: string | undefined;
      try {
        const share = await ensureShareSlug(payload);
        shareSlug = share.slug;
      } catch {}

      const { markdown } = await ensureProfileCardMarkdown(
        payload,
        shareSlug,
        locale,
      );
      await navigator.clipboard.writeText(markdown);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 2500);
    }
  }, [locale, payload, state]);

  const label =
    state === "copied"
      ? t("markdownCopied")
      : state === "loading"
        ? t("creatingMarkdown")
        : state === "error"
          ? t("shareMarkdownError")
          : t("copyMarkdown");

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={state === "loading"}
      aria-label={t("copyMarkdown")}
      aria-live="polite"
      className={`i18n-cta glass-pill inline-flex w-full items-center justify-center gap-2 py-2.5 font-display text-sm font-bold transition-colors md:py-3 ${
        state === "copied"
          ? "text-primary"
          : state === "error"
            ? "text-red-400"
            : "text-on-surface hover:text-primary active:scale-[0.98]"
      } disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      <IconCode className="h-4 w-4 shrink-0 opacity-90" />
      <span>{label}</span>
    </button>
  );
}
