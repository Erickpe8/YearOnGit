"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { ErrorScreen } from "@/components/error/error-screen";
import { PageShell } from "@/components/layout/page-shell";
import { isAppError } from "@/lib/errors/app-error";
import { isErrorStatusCode } from "@/lib/errors/catalog";
import { ERROR_CODES } from "@/lib/errors/codes";
import { normalizeError } from "@/lib/errors/normalize";
import { fetchJson } from "@/lib/http/fetch-json";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import { saveWrappedPayload } from "@/lib/wrapped/storage";
import type { WrappedPayload } from "@/lib/wrapped/types";
import { useApp } from "@/providers/app-provider";
import { useWrappedBeat } from "@/providers/sfx-provider";

type LoadState = "loading" | "error";

export function LoadingScreen({ musicEnabled = true }: { musicEnabled?: boolean }) {
  const { t } = useApp();
  const { data: session } = useSession();
  useViewI18n("loading");
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<ReturnType<typeof normalizeError> | null>(
    null,
  );
  const fetchedRef = useRef(false);
  useWrappedBeat(musicEnabled && loadState === "loading");

  const displayName =
    session?.user?.login ?? session?.user?.name ?? null;

  const fetchWrapped = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    setProgress(0);

    try {
      const payload = await fetchJson<WrappedPayload>("/api/wrapped", {
        retries: 2,
      });
      saveWrappedPayload(payload);
      setProgress(100);

      setTimeout(() => router.push("/wrapped"), 400);
    } catch (error) {
      const appError = isAppError(error) ? error : normalizeError(error);
      if (
        appError.statusCode === 403 ||
        appError.code === ERROR_CODES.AUTHORIZATION
      ) {
        router.replace("/");
        return;
      }
      setLoadState("error");
      setLoadError(appError);
    }
  }, [router]);

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

  if (loadState === "error" && loadError) {
    const isAuth = loadError.code === ERROR_CODES.AUTHENTICATION;
    const isRate = loadError.code === ERROR_CODES.RATE_LIMIT;
    const isNetwork =
      loadError.code === ERROR_CODES.NETWORK ||
      loadError.code === ERROR_CODES.TIMEOUT;
    const status = loadError.statusCode ?? (isNetwork ? 504 : 500);
    const code = isAuth
      ? 401
      : isRate
        ? 429
        : isErrorStatusCode(status)
          ? status
          : 500;

    return (
      <ErrorScreen
        code={code}
        titleKey={
          isAuth
            ? "githubReconnectTitle"
            : isRate
              ? "rateLimitTitle"
              : undefined
        }
        descriptionKey={
          isAuth
            ? "githubReconnectDescription"
            : isRate
              ? "rateLimitDescription"
              : isNetwork
                ? "networkRetryMessage"
                : undefined
        }
        onRetry={() => void fetchWrapped()}
        requestId={loadError.requestId}
        signInCallbackUrl="/loading"
        actionLabels={
          isAuth ? { signin: t("errorReconnectGitHub") } : undefined
        }
      />
    );
  }

  return (
    <PageShell immersive>
      <main className="relative z-10 flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center self-center px-4 py-6 text-center max-[390px]:px-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card brand-wordmark-glow mb-6 rounded-2xl px-7 py-5"
        >
          <BrandWordmark size="lg" />
        </motion.div>

        {displayName ? (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="i18n-text mb-1.5 font-display text-sm font-semibold text-primary"
          >
            {t("welcomeBack", { name: displayName })}
          </motion.p>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="i18n-text mb-2.5 font-display text-xl font-bold leading-snug text-on-surface md:text-2xl"
        >
          {t("buildingRecap")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="i18n-text mb-6 max-w-md text-sm leading-relaxed text-on-surface-variant md:text-base"
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
