"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CommitsSlide } from "@/components/wrapped/slides/commits-slide";
import { interpolate } from "@/lib/i18n/interpolate";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import { useRandomWrappedStats } from "@/lib/wrapped/use-random-wrapped-stats";
import { useApp } from "@/providers/app-provider";

const TOTAL_SLIDES = 6;

const HEATMAP_COLORS = [
  "bg-surface-variant/30",
  "bg-primary/25",
  "bg-primary/55",
  "bg-primary",
];

const slideMotion = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function WrappedExperience() {
  const { t, setHeaderProgress } = useApp();
  const { data: session } = useSession();
  useViewI18n("wrapped");
  const [slide, setSlide] = useState(0);
  const { stats, regenerate } = useRandomWrappedStats();
  const username =
    session?.user?.login ?? session?.user?.name ?? "developer";

  const restart = useCallback(() => {
    regenerate();
    setSlide(0);
  }, [regenerate]);

  useEffect(() => {
    setHeaderProgress({ current: slide + 1, total: TOTAL_SLIDES });
    return () => setHeaderProgress(null);
  }, [slide, setHeaderProgress]);

  const next = useCallback(() => {
    setSlide((s) => Math.min(s + 1, TOTAL_SLIDES - 1));
  }, []);

  const prev = useCallback(() => {
    setSlide((s) => Math.max(s - 1, 0));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!stats) {
    return (
      <PageShell immersive>
        <main className="relative z-10 flex min-h-[calc(100dvh-7rem)] flex-1 flex-col max-[390px]:min-h-[calc(100dvh-6.5rem)]" />
      </PageShell>
    );
  }

  return (
    <PageShell immersive>
      <main
        className="relative z-10 flex min-h-[calc(100dvh-7rem)] flex-1 flex-col max-[390px]:min-h-[calc(100dvh-6.5rem)]"
        onClick={slide < TOTAL_SLIDES - 1 ? next : undefined}
        role="presentation"
      >
        <AnimatePresence mode="wait">
          {slide === 0 && (
            <motion.section
              key="intro"
              {...slideMotion}
              className="flex flex-1 flex-col items-center justify-center px-4 text-center max-[390px]:px-3"
            >
              <p className="mb-3 font-display text-lg text-on-surface-variant max-[390px]:text-base md:mb-4 md:text-2xl">
                {t("introHey")}
              </p>
              <h2 className="glow-text font-display text-[40px] font-extrabold text-on-surface max-[390px]:text-[36px] md:text-7xl">
                @{username}
              </h2>
              <p className="mt-4 text-on-surface-variant max-[390px]:text-sm md:mt-6">
                {t("yearLabel")}
              </p>
            </motion.section>
          )}

          {slide === 1 && <CommitsSlide commits={stats.commits} />}

          {slide === 2 && (
            <motion.section
              key="heatmap"
              {...slideMotion}
              className="flex flex-1 flex-col items-center justify-center px-5 md:px-12"
            >
              <h2 className="i18n-text mb-2 font-display text-2xl font-bold text-primary">
                {t("globalImpact")}
              </h2>
              <p className="i18n-text mb-8 text-sm leading-relaxed text-on-surface-variant">
                {interpolate(t("contributions2026"), {
                  count: stats.contributions,
                })}
              </p>
              <div className="glass-card w-full max-w-3xl rounded-xl p-4 md:p-6">
                <div className="heatmap-grid w-full">
                  {stats.heatmap.map((level, i) => (
                    <div
                      key={i}
                      className={`heatmap-cell ${HEATMAP_COLORS[level]}`}
                    />
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {slide === 3 && (
            <motion.section
              key="languages"
              {...slideMotion}
              className="flex flex-1 flex-col items-center justify-center px-6"
            >
              <h2 className="i18n-text mb-10 font-display text-3xl font-bold">
                {t("languages")}
              </h2>
              <div className="glass-card w-full max-w-md space-y-6 rounded-xl p-6">
                {stats.languages.map((lang) => (
                  <div key={lang.name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: lang.color }}
                        />
                        {lang.name}
                      </span>
                      <span className="font-display font-bold text-primary">
                        {lang.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lang.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: lang.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {slide === 4 && (
            <motion.section
              key="streak"
              {...slideMotion}
              className="flex flex-1 flex-col items-center justify-center px-6 text-center"
            >
              <p className="i18n-text mb-4 font-display text-xl text-on-surface-variant md:text-2xl">
                {t("longestStreak")}
              </p>
              <div className="glow-text font-display text-[80px] font-extrabold leading-none text-primary md:text-[120px]">
                {stats.streakDays}
              </div>
              <p className="i18n-label mt-2 font-display text-lg uppercase text-on-surface-variant">
                {t("days")}
              </p>
              <p className="i18n-text mt-8 max-w-sm px-2 leading-relaxed text-on-surface-variant">
                {interpolate(t("topContributors"), {
                  percent: stats.topPercent,
                })}
              </p>
            </motion.section>
          )}

          {slide === 5 && (
            <motion.section
              key="summary"
              {...slideMotion}
              className="flex flex-1 flex-col items-center justify-center px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
                <span className="i18n-badge mb-4 inline-block rounded-full bg-primary/15 px-3 py-1 font-display text-xs font-bold uppercase text-primary">
                  {t("wrapped26")}
                </span>
                <h2 className="i18n-text mb-2 font-display text-2xl font-extrabold max-[390px]:text-xl md:text-3xl">
                  {t("your2026")}
                </h2>
                <p className="mb-8 text-on-surface-variant">@{username}</p>

                <div className="mb-8 grid grid-cols-2 gap-3 text-left">
                  <div className="rounded-lg border border-white/5 bg-surface-container p-3">
                    <p className="i18n-label text-[10px] font-bold uppercase text-on-surface-variant">
                      {t("commitsLabel")}
                    </p>
                    <p className="font-display text-2xl font-bold text-primary">
                      {stats.commits}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-surface-container p-3">
                    <p className="i18n-label text-[10px] font-bold uppercase text-on-surface-variant">
                      {t("days")}
                    </p>
                    <p className="font-display text-2xl font-bold text-primary">
                      {stats.streakDays}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    className="i18n-cta btn-primary w-full rounded-full py-3 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    {t("shareOnX")}
                  </button>
                  <button
                    type="button"
                    className="i18n-cta glass-pill w-full py-3 font-display text-sm font-bold text-on-surface transition-colors hover:text-primary"
                  >
                    {t("copyLink")}
                  </button>
                  <button
                    type="button"
                    onClick={restart}
                    className="text-sm text-on-surface-variant transition-colors hover:text-primary"
                  >
                    {t("viewAgain")}
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {slide < TOTAL_SLIDES - 1 && (
          <div className="pointer-events-none absolute bottom-8 left-0 right-0 flex justify-center">
            <p className="text-xs text-on-surface-variant/50">
              tap / next
            </p>
          </div>
        )}
      </main>
    </PageShell>
  );
}
