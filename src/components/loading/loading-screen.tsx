"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { PageShell } from "@/components/layout/page-shell";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import { saveWrappedPayload } from "@/lib/wrapped/storage";
import type { WrappedPayload } from "@/lib/wrapped/types";
import { useApp } from "@/providers/app-provider";
import { useSfx, useWrappedBeat } from "@/providers/sfx-provider";

type LoadState = "loading" | "error";

export function LoadingScreen() {
  const { t } = useApp();
  const { data: session } = useSession();
  useViewI18n("loading");
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  useWrappedBeat(loadState === "loading");

  const displayName =
    session?.user?.login ?? session?.user?.name ?? null;

  const fetchWrapped = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);
    setProgress(0);

    try {
      const response = await fetch("/api/wrapped");

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? t("wrappedLoadError"));
      }

      const payload = (await response.json()) as WrappedPayload;
      saveWrappedPayload(payload);
      setProgress(100);

      setTimeout(() => router.push("/wrapped"), 400);
    } catch (error) {
      setLoadState("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("wrappedLoadError"),
      );
    }
  }, [router, t]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void fetchWrapped();
  }, [fetchWrapped]);

  useEffect(() => {
    if (loadState !== "loading") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [loadState]);

  if (loadState === "error") {
    return (
      <PageShell immersive className="items-center justify-center">
        <main className="relative z-10 flex min-h-[calc(100dvh-7rem)] w-full max-w-lg flex-col items-center justify-center px-4 text-center max-[390px]:min-h-[calc(100dvh-6.5rem)] max-[390px]:px-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full rounded-2xl p-8"
          >
            <h1 className="i18n-text mb-3 font-display text-2xl font-bold text-on-surface">
              {t("wrappedLoadError")}
            </h1>
            {errorMessage ? (
              <p className="mb-8 text-sm leading-relaxed text-on-surface-variant">
                {errorMessage}
              </p>
            ) : null}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void fetchWrapped()}
                className="i18n-cta btn-primary w-full rounded-full py-3 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
              >
                {t("retry")}
              </button>
              <Link
                href="/"
                className="i18n-cta glass-pill w-full py-3 text-center font-display text-sm font-bold text-on-surface transition-colors hover:text-primary"
              >
                {t("goHome")}
              </Link>
            </div>
          </motion.div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell immersive className="items-center justify-center">
      <main className="relative z-10 flex min-h-[calc(100dvh-7rem)] w-full max-w-lg flex-col items-center justify-center px-4 text-center max-[390px]:min-h-[calc(100dvh-6.5rem)] max-[390px]:px-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card brand-wordmark-glow mb-10 rounded-2xl px-8 py-6"
        >
          <BrandWordmark size="lg" />
        </motion.div>

        {displayName ? (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="i18n-text mb-2 font-display text-sm font-semibold text-primary"
          >
            {t("welcomeBack", { name: displayName })}
          </motion.p>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="i18n-text mb-3 font-display text-2xl font-bold leading-snug text-on-surface md:text-3xl"
        >
          {t("buildingRecap")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="i18n-text mb-10 max-w-md leading-relaxed text-on-surface-variant"
        >
          {t("gatheringCommits")}
        </motion.p>

        <div className="w-full">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-surface-variant">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-container to-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          <p className="font-display text-sm text-on-surface-variant">
            {progress}%
          </p>
        </div>
      </main>
    </PageShell>
  );
}
