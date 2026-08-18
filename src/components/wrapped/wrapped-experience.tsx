"use client";

import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AchievementsSlide } from "@/components/wrapped/achievements-slide";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import { CommunitySlide } from "@/components/wrapped/community-slide";
import {
  ContributionCompositionSlide,
  type ContributionStoryHandle,
} from "@/components/wrapped/contribution-composition-slide";
import {
  FavoriteRepoRaceSlide,
  type FavoriteRepoRaceHandle,
} from "@/components/wrapped/favorite-repo-race-slide";
import { HighlightSlide } from "@/components/wrapped/highlight-slide";
import { LanguagesPodium } from "@/components/wrapped/languages-podium";
import { OverviewIntroSlide } from "@/components/wrapped/overview-intro-slide";
import { PageShell } from "@/components/layout/page-shell";
import { StreakSlide } from "@/components/wrapped/streak-slide";
import { SummarySlide } from "@/components/wrapped/summary-slide";
import { WrappedHeatmap } from "@/components/wrapped/wrapped-heatmap";
import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import {
  formatMonthName,
  formatNumber,
  formatWrappedDate,
} from "@/lib/wrapped/format";
import { planWrappedSlides } from "@/lib/wrapped/plan-slides";
import {
  computeSlideRuntime,
} from "@/lib/wrapped/slide-timing";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";
import { useStoriesNavigation } from "@/lib/wrapped/use-stories-navigation";
import type { WrappedPayload } from "@/lib/wrapped/types";
import { useWrappedStats } from "@/lib/wrapped/use-wrapped-stats";
import { buildHeatmapStoryInsights } from "@/lib/wrapped/heatmap-story";
import { sceneFromSlide } from "@/lib/audio/score";
import { useApp } from "@/providers/app-provider";
import { useSfx, useWrappedBeat } from "@/providers/sfx-provider";

export type WrappedExperienceProps = {
  mode?: "owner" | "shared";
  initialPayload?: WrappedPayload | null;
};

export function WrappedExperience({
  mode = "owner",
  initialPayload = null,
}: WrappedExperienceProps = {}) {
  const { t, locale } = useApp();
  const { setScene } = useSfx();
  useWrappedBeat();
  useViewI18n("wrapped");
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const isShared = mode === "shared";
  const { stats, username, payload, ready } = useWrappedStats({
    initialPayload,
    shared: isShared,
  });
  const reducedMotion = usePrefersReducedMotion();

  const displayName = username ?? "developer";

  const slides = useMemo(
    () => (stats ? planWrappedSlides(stats) : []),
    [stats],
  );
  const totalSlides = slides.length;
  const current = slides[slide] ?? null;

  const weekdayActivityPct = useMemo(() => {
    if (!stats) return 0;
    const total =
      stats.weekdayContributionsTotal + stats.weekendContributions;
    if (total === 0) return 0;
    return Math.round((stats.weekdayContributionsTotal / total) * 1000) / 10;
  }, [stats]);

  const heatmapStory = useMemo(() => {
    if (!stats) return null;
    return buildHeatmapStoryInsights(
      {
        weekdayContributions: stats.weekdayContributions,
        levels: stats.heatmap,
        dates: stats.heatmapDates ?? stats.calendar?.heatmapDates,
        totalContributions: stats.totalContributions,
        activeDays: stats.activeDays,
      },
      locale,
    );
  }, [stats, locale]);

  const heatmapTeasers = useMemo(() => {
    if (!stats) return undefined;
    return {
      day: [
        t("heatmapTeaserLine1", {
          count: formatNumber(stats.totalContributions, locale),
        }),
        t("heatmapTeaserLine2"),
        t("heatmapTeaserLine3"),
      ],
      month: [
        t("heatmapMonthTeaserLine1"),
        t("heatmapMonthTeaserLine2"),
        t("heatmapMonthTeaserLine3"),
      ],
      weekday: [
        t("heatmapWeekdayTeaserLine1"),
        t("heatmapWeekdayTeaserLine2"),
        t("heatmapWeekdayTeaserLine3"),
      ],
      weeks: [
        t("heatmapWeeksTeaserLine1"),
        t("heatmapWeeksTeaserLine2"),
        t("heatmapWeeksTeaserLine3"),
      ],
    };
  }, [locale, stats, t]);

  const restart = useCallback(() => {
    setSlide(0);
    if (!isShared) {
      router.push("/loading");
    }
  }, [isShared, router]);

  const next = useCallback(() => {
    setSlide((currentIndex) =>
      Math.min(currentIndex + 1, Math.max(totalSlides - 1, 0)),
    );
  }, [totalSlides]);

  const prev = useCallback(() => {
    setSlide((currentIndex) => Math.max(currentIndex - 1, 0));
  }, []);

  const [playbackPaused, setPlaybackPaused] = useState(false);
  const playbackPausedRef = useRef(false);
  const deadlineRef = useRef<number | null>(null);
  const remainingWhilePausedRef = useRef<number | null>(null);

  const pausePlayback = useCallback(() => {
    if (playbackPausedRef.current) return;
    playbackPausedRef.current = true;
    if (deadlineRef.current != null) {
      remainingWhilePausedRef.current = Math.max(
        0,
        deadlineRef.current - Date.now(),
      );
    }
    setPlaybackPaused(true);
  }, []);

  const resumePlayback = useCallback(() => {
    if (!playbackPausedRef.current) return;
    playbackPausedRef.current = false;
    if (remainingWhilePausedRef.current != null) {
      deadlineRef.current = Date.now() + remainingWhilePausedRef.current;
      remainingWhilePausedRef.current = null;
    }
    setPlaybackPaused(false);
  }, []);

  const contributionStoryRef = useRef<ContributionStoryHandle | null>(null);
  const favoriteRepoRaceRef = useRef<FavoriteRepoRaceHandle | null>(null);

  const tryAdvanceStoryOrNext = useCallback(() => {
    if (slide < totalSlides - 1) next();
  }, [slide, totalSlides, next]);

  const storiesHandlers = useStoriesNavigation({
    onNext: tryAdvanceStoryOrNext,
    onPrev: () => {
      if (slide > 0) prev();
    },
    onHoldStart: pausePlayback,
    onHoldEnd: resumePlayback,
  });

  useEffect(() => {
    if (totalSlides === 0 || !current) {
      deadlineRef.current = null;
      remainingWhilePausedRef.current = null;
      playbackPausedRef.current = false;
      setPlaybackPaused(false);
      return;
    }

    const isLast = slide >= totalSlides - 1;
    const runtime = computeSlideRuntime({
      slide: current,
      reducedMotion,
      stats,
      heatmapStory,
      heatmapTeasers,
    });
    playbackPausedRef.current = false;
    setPlaybackPaused(false);
    remainingWhilePausedRef.current = null;
    deadlineRef.current = isLast ? null : Date.now() + runtime.durationMs;
  }, [
    slide,
    totalSlides,
    current,
    reducedMotion,
    stats,
    heatmapStory,
    heatmapTeasers,
  ]);

  useEffect(() => {
    if (totalSlides === 0 || !current) return;
    if (slide >= totalSlides - 1) return;
    if (playbackPaused) return;
    if (deadlineRef.current == null) return;

    const ms = Math.max(0, deadlineRef.current - Date.now());
    const advanceTimer = window.setTimeout(() => {
      next();
    }, ms);

    return () => {
      window.clearTimeout(advanceTimer);
    };
  }, [slide, totalSlides, current, next, playbackPaused]);

  useEffect(() => {
    setSlide(0);
  }, [stats]);

  useEffect(() => {
    if (!current) return;
    const scene = sceneFromSlide(current);
    setScene(scene);
  }, [current, setScene]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (favoriteRepoRaceRef.current?.trySelectWithEnter()) {
          event.preventDefault();
          return;
        }
      }
      if (event.key === "ArrowRight") tryAdvanceStoryOrNext();
      if (event.key === "ArrowLeft") prev();
      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        tryAdvanceStoryOrNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryAdvanceStoryOrNext, prev]);

  if (!ready || !stats || !current) {
    return (
      <PageShell wrapped>
        <main className="wrapped-stage" aria-busy="true" />
      </PageShell>
    );
  }

  return (
    <PageShell wrapped>
      <main
        className="wrapped-stage touch-manipulation select-none"
        role="presentation"
        {...storiesHandlers}
      >
        <AnimatePresence mode="wait">
          {current.kind === "overview" && (
            <WrappedSlideShell slideKey="year-overview">
              <OverviewIntroSlide
                stats={stats}
                displayName={displayName}
                locale={locale}
                t={t}
              />
            </WrappedSlideShell>
          )}

          {current.kind === "contribution-types" && (
            <WrappedSlideShell
              slideKey="contribution-types"
              className="wrapped-slide--composition"
            >
              <ContributionCompositionSlide
                stats={stats}
                locale={locale}
                t={t}
                storyRef={contributionStoryRef}
              />
            </WrappedSlideShell>
          )}

          {current.kind === "highlight" &&
            current.highlight.id === "favorite_repo" && (
              <FavoriteRepoRaceSlide
                stats={stats}
                locale={locale}
                t={t}
                storyRef={favoriteRepoRaceRef}
              />
            )}

          {current.kind === "highlight" &&
            current.highlight.id !== "favorite_repo" && (
              <HighlightSlide
                highlight={current.highlight}
                locale={locale}
                t={t}
              />
            )}

          {current.kind === "heatmap" && (
            <WrappedSlideShell slideKey="heatmap">
              <h2 className="i18n-text wrapped-slide-title shrink-0 font-display font-bold text-primary">
                {t("yearInPixels")}
              </h2>
              <p className="i18n-text shrink-0 text-center text-xs text-on-surface-variant md:text-sm">
                {t("contributions2026", {
                  count: stats.totalContributions,
                })}
              </p>
              <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-1">
                <WrappedHeatmap
                  levels={stats.heatmap}
                  dates={stats.heatmapDates ?? stats.calendar?.heatmapDates}
                  peakDate={stats.mostActiveDay}
                  peakIndex={
                    stats.heatmapPeakIndex ?? stats.calendar?.heatmapPeakIndex
                  }
                  peakDateLabel={
                    stats.mostActiveDay
                      ? formatWrappedDate(stats.mostActiveDay, locale)
                      : null
                  }
                  peakCaption={t("heatmapPeakCaption")}
                  peakCount={stats.mostActiveDayCount}
                  peakCountLabel={t("heatmapPeakCountLabel")}
                  teaserLines={heatmapTeasers?.day ?? []}
                  peakMonth={stats.mostActiveMonth}
                  peakMonthLabel={
                    stats.mostActiveMonth
                      ? formatMonthName(stats.mostActiveMonth, locale)
                      : null
                  }
                  peakMonthCaption={t("heatmapMonthCaption")}
                  peakMonthCount={stats.mostActiveMonthCount}
                  peakMonthCountLabel={t("heatmapMonthCountLabel")}
                  monthTeaserLines={heatmapTeasers?.month ?? []}
                  weekdayInsight={heatmapStory?.weekday ?? null}
                  perfectWeeks={heatmapStory?.perfectWeeks ?? null}
                  averages={heatmapStory?.averages ?? null}
                  weekdayTeaserLines={heatmapTeasers?.weekday ?? []}
                  weeksTeaserLines={heatmapTeasers?.weeks ?? []}
                  weekdayTitle={t("heatmapWeekdayFavorite")}
                  weekdayCountLabel={t("heatmapWeekdayCountLabel")}
                  perfectWeeksLead={t("heatmapPerfectWeeksLead")}
                  perfectWeeksLabel={t("heatmapPerfectWeeksLabel")}
                  perfectWeekLabelSingular={t(
                    "heatmapPerfectWeekLabelSingular",
                  )}
                  mosaicLine={t("heatmapMosaicLine")}
                  averageLead={t("heatmapAverageLead")}
                  averageLabel={t("heatmapAverageLabel")}
                  activeDaysLead={t("heatmapActiveDaysLead")}
                  activeDaysLabel={t("heatmapActiveDaysLabel")}
                  totalLead={t("heatmapTotalLead")}
                  totalLabel={t("heatmapTotalLabel")}
                  locale={locale}
                />
              </div>
            </WrappedSlideShell>
          )}

          {current.kind === "languages" && (
            <WrappedSlideShell slideKey="languages">
              <h2 className="i18n-text wrapped-slide-title shrink-0 font-display font-bold">
                {t("yourStack")}
              </h2>
              {stats.topLanguage ? (
                <p className="i18n-text shrink-0 text-center text-xs text-on-surface-variant md:text-sm">
                  {t("topLanguage", {
                    language: stats.topLanguage,
                    percent: stats.topLanguagePercentage,
                  })}
                </p>
              ) : null}
              <LanguagesPodium
                languages={stats.languages.languages}
                t={t}
              />
              <p className="i18n-text shrink-0 text-xs text-on-surface-variant md:text-sm">
                {t("languagePodiumFootnote", {
                  shown: Math.min(5, stats.languageCount),
                  total: stats.languageCount,
                })}
              </p>
            </WrappedSlideShell>
          )}

          {current.kind === "community" && (
            <CommunitySlide stats={stats} locale={locale} t={t} />
          )}

          {current.kind === "achievements" && (
            <AchievementsSlide
              achievements={current.achievements}
              locale={locale}
              t={t}
            />
          )}

          {current.kind === "streak" && (
            <StreakSlide
              stats={stats}
              locale={locale}
              weekdayActivityPct={weekdayActivityPct}
              t={t}
            />
          )}

          {current.kind === "summary" && (
            <SummarySlide
              stats={stats}
              locale={locale}
              displayName={displayName}
              isShared={isShared}
              payload={payload}
              onRestart={restart}
              t={t}
            />
          )}
        </AnimatePresence>
      </main>
    </PageShell>
  );
}
