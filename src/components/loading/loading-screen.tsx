"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconLoader } from "@/components/ui/icons";
import { PageShell } from "@/components/layout/page-shell";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import { useApp } from "@/providers/app-provider";

export function LoadingScreen() {
  const { t } = useApp();
  useViewI18n("loading");
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => router.push("/wrapped"), 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, router]);

  return (
    <PageShell immersive className="items-center justify-center">
      <main className="relative z-10 flex min-h-[calc(100dvh-7rem)] w-full max-w-lg flex-col items-center justify-center px-4 text-center max-[390px]:min-h-[calc(100dvh-6.5rem)] max-[390px]:px-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card mb-10 flex h-20 w-20 items-center justify-center rounded-2xl"
        >
          <IconLoader className="h-10 w-10 animate-spin text-primary" />
        </motion.div>

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
