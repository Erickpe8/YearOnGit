"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useApp } from "@/providers/app-provider";
import { useConsent } from "@/providers/consent-provider";
import { useSfx } from "@/providers/sfx-provider";
import type { PublicSiteConfig } from "@/lib/admin/settings";

type MobileStickyCtaProps = {
  siteConfig: PublicSiteConfig;
  onGitHub: () => void;
};

export function MobileStickyCta({
  siteConfig,
  onGitHub,
}: MobileStickyCtaProps) {
  const { t } = useApp();
  const { unlock } = useSfx();
  const { data: session, status } = useSession();
  const { ready, decided, preferencesOpen } = useConsent();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user);
  const wrappedLive = siteConfig.wrappedEnabled;
  const cookieBlocking = ready && (!decided || preferencesOpen);

  if (!wrappedLive && isAuthenticated) return null;
  if (cookieBlocking) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#0d1117]/92 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      {wrappedLive && isAuthenticated ? (
        <Link
          href="/loading"
          onClick={() => unlock()}
          className="btn-primary btn-primary-glow flex w-full items-center justify-center rounded-full py-3 text-sm font-bold text-white"
        >
          {t("viewMyWrapped")}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onGitHub}
          className="btn-primary btn-primary-glow flex w-full items-center justify-center rounded-full py-3 text-sm font-bold text-white"
        >
          {t("landingStickyCta")}
        </button>
      )}
    </div>
  );
}

export function LandingShareButton() {
  const { t } = useApp();
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  const share = useCallback(async () => {
    const url = window.location.origin;
    const title = t("landingShareTitle");
    const text = t("landingShareText");
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        setState("done");
      } else {
        await navigator.clipboard.writeText(url);
        setState("done");
      }
      window.setTimeout(() => setState("idle"), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setState("idle");
        return;
      }
      setState("error");
      window.setTimeout(() => setState("idle"), 2200);
    }
  }, [t]);

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="glass-pill relative z-40 px-4 py-2 font-display text-xs font-bold text-on-surface transition-colors hover:text-primary"
      aria-live="polite"
    >
      {state === "done"
        ? t("landingShareDone")
        : state === "error"
          ? t("landingShareError")
          : t("landingShareSite")}
    </button>
  );
}
