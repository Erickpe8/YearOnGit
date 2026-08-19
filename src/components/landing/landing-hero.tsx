"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { IconArrowRight, IconLock } from "@/components/ui/icons";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import { useApp } from "@/providers/app-provider";
import { useSfx } from "@/providers/sfx-provider";
import {
  CommitsDecorCard,
  HeatmapCard,
  LandingCardCluster,
  LanguagesCard,
  ReposDecorCard,
} from "./landing-card-cluster";

function GitHubIcon() {
  return (
    <svg aria-hidden className="h-5 w-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.412-4.041-1.412-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function openGitHubPopup(): Window | null {
  const width = 520;
  const height = 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  return window.open(
    "about:blank",
    "yearongit-github",
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}

export function LandingHero() {
  const { t } = useApp();
  const { unlock } = useSfx();
  const { data: session, status, update } = useSession();
  const router = useRouter();
  useViewI18n("landing");

  const displayName =
    session?.user?.login ?? session?.user?.name ?? null;
  const isAuthenticated = status === "authenticated" && Boolean(session?.user);

  const goToWrapped = useCallback(() => {
    unlock();
    router.push("/loading");
  }, [unlock, router]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "yearongit:oauth") return;
      void update().then(() => {
        goToWrapped();
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [goToWrapped, update]);

  const handleGitHub = useCallback(() => {
    unlock();

    const popup = openGitHubPopup();
    if (!popup) {
      void signIn("github", { callbackUrl: "/loading" });
      return;
    }

    const done = `${window.location.origin}/auth/popup-done`;
    void signIn("github", { redirect: false, callbackUrl: done }).then(
      (result) => {
        const url = result?.url;
        if (!url) {
          popup.close();
          void signIn("github", { callbackUrl: "/loading" });
          return;
        }
        popup.location.href = url.startsWith("http")
          ? url
          : new URL(url, window.location.origin).href;
      },
    );
  }, [unlock]);

  return (
    <LandingCardCluster>
      <div className="relative z-40 mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#39d353]/20 bg-[#39d353]/5 px-4 py-1.5 max-[390px]:mb-4">
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#39d353]" />
        <span className="i18n-badge font-display text-[10px] font-bold uppercase text-[#39d353] max-[390px]:text-[9px]">
          {t("editionLive")}
        </span>
      </div>

      <div className="relative z-40 mb-4 max-[390px]:mb-3">
        <CommitsDecorCard />
        <ReposDecorCard />
        <h1 className="hero-headline i18n-text relative z-40 font-display text-[32px] font-extrabold text-on-surface max-[390px]:text-[26px] md:text-[48px]">
          {isAuthenticated && displayName ? (
            t("welcomeBack", { name: displayName })
          ) : (
            <>
              {t("taglinePrefix")}
              <span className="text-[#39d353] italic"> GitHub</span>
              {t("taglineSuffix")}
            </>
          )}
        </h1>
      </div>

      <p className="hero-headline i18n-text relative z-40 mb-6 text-base leading-relaxed text-on-surface-variant max-[390px]:mb-5 max-[390px]:text-sm">
        {t("landingDescription")}
      </p>

      <div className="relative z-40 mx-auto flex w-full max-w-sm flex-col items-center gap-3 max-[390px]:max-w-[300px]">
        <div className="relative w-full">
          <HeatmapCard />
          <LanguagesCard />
          {isAuthenticated ? (
            <Link
              href="/loading"
              onClick={() => {
                unlock();
              }}
              className="btn-primary btn-primary-glow group relative z-40 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-95 max-[390px]:px-5 max-[390px]:py-3 max-[390px]:text-sm"
            >
              <span className="i18n-cta text-center">{t("viewMyWrapped")}</span>
              <IconArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleGitHub}
              className="btn-primary btn-primary-glow group relative z-40 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-95 max-[390px]:px-5 max-[390px]:py-3 max-[390px]:text-sm"
            >
              <GitHubIcon />
              <span className="i18n-cta text-center">{t("continueWithGitHub")}</span>
              <IconArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {!isAuthenticated ? (
          <p className="i18n-micro relative z-40 flex max-w-xs flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-display text-[10px] font-semibold text-on-surface-variant/70 max-[390px]:max-w-[280px] max-[390px]:text-[9px]">
            <IconLock className="h-3.5 w-3.5 shrink-0" />
            <span>{t("privacyNote")}</span>
          </p>
        ) : null}
      </div>
    </LandingCardCluster>
  );
}
