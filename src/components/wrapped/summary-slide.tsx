"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import { ShareCopyButton } from "@/components/wrapped/share-copy-button";
import { ShareMarkdownButton } from "@/components/wrapped/share-markdown-button";
import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";
import {
  IconCircleAlert,
  IconFlame,
  IconFolder,
  IconGitCommit,
  IconGitPullRequest,
  IconLanguage,
  IconMessageCode,
} from "@/components/ui/icons";
import type { Locale } from "@/lib/i18n/supported-locales";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { WrappedPayload, WrappedStats } from "@/lib/wrapped/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";
import { useSfx } from "@/providers/sfx-provider";

type SummarySlideProps = {
  stats: WrappedStats;
  locale: Locale;
  displayName: string;
  isShared: boolean;
  payload: WrappedPayload | null;
  onRestart: () => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type GridStat = {
  key: string;
  label: string;
  value: number;
  icon: ReactNode;
  delay: number;
};

function GridStatCard({
  label,
  value,
  icon,
  delay,
  locale,
  reducedMotion,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  delay: number;
  locale: Locale;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      className="summary-grid-stat flex min-w-0 flex-col items-start gap-1 rounded-xl bg-white/[0.04] px-2.5"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion ? { duration: 0 } : { duration: 0.35, delay, ease: EASE }
      }
    >
      <span className="flex w-full min-w-0 items-center gap-1.5 text-primary/80">
        <span className="shrink-0">{icon}</span>
        <span className="i18n-text min-w-0 flex-1 text-[10px] leading-snug text-on-surface-variant md:text-[11px]">
          {label}
        </span>
      </span>
      <p className="summary-grid-stat__value font-display font-bold leading-none text-on-surface">
        <AnimatedCounter value={value} locale={locale} durationMs={900} />
      </p>
    </motion.div>
  );
}

export function SummarySlide({
  stats,
  locale,
  displayName,
  isShared,
  payload,
  onRestart,
  t,
}: SummarySlideProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { cue } = useSfx();
  const avatarUrl = stats.profile.avatarUrl;
  const login = stats.profile.login || displayName;

  useEffect(() => {
    cue("finale");
  }, [cue]);

  const gridStats: GridStat[] = [
    {
      key: "commits",
      label: t("totalCommits"),
      value: stats.totalCommits,
      icon: <IconGitCommit className="h-3.5 w-3.5" />,
      delay: 0.48,
    },
    {
      key: "prs",
      label: t("totalPullRequests"),
      value: stats.totalPullRequests,
      icon: <IconGitPullRequest className="h-3.5 w-3.5" />,
      delay: 0.54,
    },
    {
      key: "issues",
      label: t("totalIssues"),
      value: stats.totalIssues,
      icon: <IconCircleAlert className="h-3.5 w-3.5" />,
      delay: 0.6,
    },
    {
      key: "reviews",
      label: t("totalCodeReviews"),
      value: stats.totalCodeReviews,
      icon: <IconMessageCode className="h-3.5 w-3.5" />,
      delay: 0.66,
    },
    {
      key: "repos",
      label: t("summaryStatActiveRepos") || t("activeRepositories"),
      value: stats.activeRepositories,
      icon: <IconFolder className="h-3.5 w-3.5" />,
      delay: 0.72,
    },
    {
      key: "langs",
      label: t("languagesLabel"),
      value: stats.languageCount,
      icon: <IconLanguage className="h-3.5 w-3.5" />,
      delay: 0.78,
    },
  ];

  return (
    <WrappedSlideShell
      slideKey="summary"
      centered={false}
      className="summary-slide"
    >
      <motion.div
        className="summary-collectible relative flex w-full max-w-md flex-col overflow-x-hidden rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          reducedMotion ? { duration: 0 } : { duration: 0.45, ease: EASE }
        }
      >
        <div className="summary-collectible__pattern" aria-hidden />

        <div className="summary-collectible__header relative z-[1] flex shrink-0 flex-col items-center text-center">
          <span className="summary-badge i18n-badge inline-block rounded-full bg-primary/15 px-3 py-1 font-display text-[10px] font-bold uppercase text-primary md:text-xs">
            {t("wrapped26")}
          </span>

          <motion.h2
            className="i18n-text font-display text-lg font-extrabold md:text-2xl"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 0.08, ease: EASE }
            }
          >
            {t("yearRecapClosing")}
          </motion.h2>

          <motion.div
            className="flex items-center gap-2"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 0.14, ease: EASE }
            }
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full border border-primary/30 object-cover md:h-8 md:w-8"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary md:h-8 md:w-8">
                {login.slice(0, 1).toUpperCase()}
              </span>
            )}
            <p className="font-display text-sm text-on-surface-variant md:text-base">
              @{login}
            </p>
          </motion.div>
        </div>

        <div className="summary-collectible__hero-block relative z-[1] flex shrink-0 flex-col items-center">
          <motion.p
            className="i18n-text text-[10px] uppercase tracking-[0.16em] text-on-surface-variant md:text-xs"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.3, delay: 0.2, ease: EASE }
            }
          >
            {t("totalContributions")}
          </motion.p>
          <motion.div
            className="summary-collectible__hero glow-text font-display font-extrabold leading-none text-primary"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: 0.24, ease: EASE }
            }
          >
            <AnimatedCounter
              value={stats.totalContributions}
              locale={locale}
              durationMs={reducedMotion ? 0 : 1300}
              onComplete={() => cue("metric")}
            />
          </motion.div>

          <motion.div
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.35, delay: 0.38, ease: EASE }
            }
          >
            <IconFlame className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="i18n-text text-[11px] text-on-surface-variant md:text-xs">
              {t("summaryStreakBadge")}
            </span>
            <span className="inline-flex items-baseline gap-1 font-display font-bold text-primary">
              <span className="text-xs tabular-nums md:text-[13px]">
                <AnimatedCounter
                  value={stats.longestStreak}
                  locale={locale}
                  durationMs={1100}
                />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                {t("days")}
              </span>
            </span>
          </motion.div>
        </div>

        <div className="relative z-[1] grid w-full shrink-0 grid-cols-2 gap-2 sm:grid-cols-3">
          {gridStats.map((stat) => (
            <GridStatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              delay={stat.delay}
              locale={locale}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>

        <motion.div
          className="relative z-[1] flex shrink-0 flex-col gap-2"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.35, delay: 0.88, ease: EASE }
          }
        >
          {!isShared && payload ? (
            <>
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <ShareCopyButton
                  payload={payload}
                  className="sm:min-w-0 sm:flex-1"
                />
                <ShareMarkdownButton
                  payload={payload}
                  className="sm:min-w-0 sm:flex-1"
                />
              </div>
              <button
                type="button"
                onClick={onRestart}
                className="w-full text-center text-xs text-on-surface-variant transition-colors hover:text-primary md:text-sm"
              >
                {t("viewAgain")}
              </button>
            </>
          ) : (
            <a
              href="/"
              className="i18n-cta btn-primary w-full rounded-full py-2.5 text-center text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 md:py-3"
            >
              {t("createYourWrapped")}
            </a>
          )}
        </motion.div>
      </motion.div>
    </WrappedSlideShell>
  );
}
