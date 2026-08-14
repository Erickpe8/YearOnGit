"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import type { Locale } from "@/lib/i18n/supported-locales";
import { formatMonthAbbrev, formatNumber } from "@/lib/wrapped/format";
import {
  DAYS_PER_WEEK,
  MOSAIC_HOLD_MS,
  PEAK_DAY_HOLD_MS,
  PEAK_DAY_RED,
  PEAK_MONTH_HOLD_MS,
  PEAK_MONTH_YELLOW,
  PERFECT_WEEK_HOLD_MS,
  PERFECT_WEEK_MAGENTA,
  PERFECT_WEEK_STAGGER_MS,
  POST_QUESTION_PAUSE_MS,
  RESTORE_MS,
  STORY_INTRO_PAUSE_MS,
  SUMMARY_HOLD_MS,
  TYPE_LINE_PAUSE_MS,
  TYPE_MS_PER_CHAR,
  WEEKDAY_CELL_PULSE_MS,
  WEEKDAY_HIGHLIGHT_BLUE,
  WEEKDAY_REVEAL_HOLD_MS,
  WEEKDAY_WAVE_STAGGER_MS,
  type ContributionAveragesInsight,
  type PerfectWeeksInsight,
  type WeekdayInsight,
} from "@/lib/wrapped/heatmap-story";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";
import { useSfx } from "@/providers/sfx-provider";

const HEATMAP_COLORS = [
  "bg-surface-variant/30",
  "bg-primary/25",
  "bg-primary/55",
  "bg-primary",
];

const MIN_MONTH_LABEL_GAP_WEEKS = 3;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type StoryPhase =
  | "idle"
  | "dayTeaser"
  | "peakDay"
  | "monthTeaser"
  | "peakMonth"
  | "weekdayTeaser"
  | "weekdayWave"
  | "weekdayReveal"
  | "weeksTeaser"
  | "weeksWave"
  | "weeksReveal"
  | "mosaic"
  | "restore"
  | "summary"
  | "finale";

type MonthMarker = {
  month: number;
  weekIndex: number;
  label: string;
};

type WrappedHeatmapProps = {
  levels: number[];
  dates?: string[];
  peakDate?: string | null;
  peakIndex?: number | null;
  peakDateLabel?: string | null;
  peakCaption?: string | null;
  peakCount?: number | null;
  peakCountLabel?: string | null;
  teaserLines?: string[];
  peakMonth?: number | null;
  peakMonthLabel?: string | null;
  peakMonthCaption?: string | null;
  peakMonthCount?: number | null;
  peakMonthCountLabel?: string | null;
  monthTeaserLines?: string[];
  weekdayInsight?: WeekdayInsight | null;
  perfectWeeks?: PerfectWeeksInsight | null;
  averages?: ContributionAveragesInsight | null;
  weekdayTeaserLines?: string[];
  weeksTeaserLines?: string[];
  weekdayTitle?: string | null;
  weekdayCountLabel?: string | null;
  perfectWeeksLead?: string | null;
  perfectWeeksLabel?: string | null;
  perfectWeekLabelSingular?: string | null;
  mosaicLine?: string | null;
  averageLead?: string | null;
  averageLabel?: string | null;
  activeDaysLead?: string | null;
  activeDaysLabel?: string | null;
  totalLead?: string | null;
  totalLabel?: string | null;
  locale?: Locale;
};

function resolvePeakIndex({
  levels,
  dates,
  peakDate,
  peakIndex,
}: {
  levels: number[];
  dates?: string[];
  peakDate?: string | null;
  peakIndex?: number | null;
}): number | null {
  if (peakDate && dates && dates.length === levels.length) {
    const byDate = dates.findIndex((date) => date === peakDate);
    if (byDate >= 0) return byDate;
  }
  if (
    typeof peakIndex === "number" &&
    peakIndex >= 0 &&
    peakIndex < levels.length
  ) {
    return peakIndex;
  }
  return null;
}

function dateMonth(date: string | undefined): number | null {
  if (!date || date.length < 7) return null;
  const month = Number(date.slice(5, 7));
  return month >= 1 && month <= 12 ? month : null;
}

function buildMonthMarkers(
  dates: string[] | undefined,
  weekCount: number,
  locale: Locale,
): MonthMarker[] {
  if (!dates?.length || weekCount <= 0) return [];
  const markers: MonthMarker[] = [];
  let lastMonth = -1;
  for (let index = 0; index < dates.length; index += 1) {
    const month = Number(dates[index].slice(5, 7));
    if (!month || month === lastMonth) continue;
    lastMonth = month;
    const weekIndex = Math.floor(index / DAYS_PER_WEEK);
    const prev = markers[markers.length - 1];
    if (prev && weekIndex - prev.weekIndex < MIN_MONTH_LABEL_GAP_WEEKS) continue;
    const label = formatMonthAbbrev(month, locale);
    if (!label) continue;
    markers.push({ month, weekIndex, label });
  }
  return markers;
}

function phaseRank(phase: StoryPhase): number {
  const order: StoryPhase[] = [
    "idle",
    "dayTeaser",
    "peakDay",
    "monthTeaser",
    "peakMonth",
    "weekdayTeaser",
    "weekdayWave",
    "weekdayReveal",
    "weeksTeaser",
    "weeksWave",
    "weeksReveal",
    "mosaic",
    "restore",
    "summary",
    "finale",
  ];
  return order.indexOf(phase);
}

function TypewriterTeaser({
  lines,
  active,
  reducedMotion,
  onComplete,
}: {
  lines: string[];
  active: boolean;
  reducedMotion: boolean;
  onComplete?: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    if (!active) {
      setLineIndex(0);
      setCharIndex(0);
      return;
    }
    if (reducedMotion) {
      setLineIndex(Math.max(lines.length - 1, 0));
      setCharIndex(lines[lines.length - 1]?.length ?? 0);
      onComplete?.();
      return;
    }
    setLineIndex(0);
    setCharIndex(0);
  }, [active, lines, reducedMotion, onComplete]);

  useEffect(() => {
    if (!active || reducedMotion || lines.length === 0) return;

    const current = lines[lineIndex] ?? "";
    if (charIndex < current.length) {
      const timer = window.setTimeout(() => {
        setCharIndex((value) => value + 1);
      }, TYPE_MS_PER_CHAR);
      return () => window.clearTimeout(timer);
    }

    if (lineIndex < lines.length - 1) {
      const timer = window.setTimeout(() => {
        setLineIndex((value) => value + 1);
        setCharIndex(0);
      }, TYPE_LINE_PAUSE_MS);
      return () => window.clearTimeout(timer);
    }

    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [active, reducedMotion, lines, lineIndex, charIndex, onComplete]);

  if (!active || lines.length === 0) return null;

  return (
    <div className="wrapped-heatmap-teaser mx-auto flex h-full w-full max-w-lg flex-col justify-center px-3 text-center">
      {lines.map((line, index) => {
        const visible =
          index < lineIndex
            ? line
            : index === lineIndex
              ? line.slice(0, charIndex)
              : "";
        const showCaret =
          !reducedMotion &&
          index === lineIndex &&
          (index < lines.length - 1 || charIndex < line.length);
        const isQuestion = index === lines.length - 1;

        return (
          <p
            key={`${index}-${line}`}
            className={`font-display leading-snug ${
              isQuestion
                ? "mt-3 text-lg font-semibold text-primary md:text-xl"
                : index === 0
                  ? "text-base text-on-surface md:text-lg"
                  : "mt-2.5 text-base text-on-surface-variant md:text-lg"
            }`}
          >
            {visible}
            {showCaret ? (
              <span className="wrapped-heatmap-teaser-caret ml-0.5 inline-block">
                |
              </span>
            ) : null}
          </p>
        );
      })}
    </div>
  );
}

export function WrappedHeatmap({
  levels,
  dates,
  peakDate = null,
  peakIndex = null,
  peakDateLabel = null,
  peakCaption = null,
  peakCount = null,
  peakCountLabel = null,
  teaserLines = [],
  peakMonth = null,
  peakMonthLabel = null,
  peakMonthCaption = null,
  peakMonthCount = null,
  peakMonthCountLabel = null,
  monthTeaserLines = [],
  weekdayInsight = null,
  perfectWeeks = null,
  averages = null,
  weekdayTeaserLines = [],
  weeksTeaserLines = [],
  weekdayTitle = null,
  weekdayCountLabel = null,
  perfectWeeksLead = null,
  perfectWeeksLabel = null,
  perfectWeekLabelSingular = null,
  mosaicLine = null,
  averageLead = null,
  averageLabel = null,
  activeDaysLead = null,
  activeDaysLabel = null,
  totalLead = null,
  totalLabel = null,
  locale = "en",
}: WrappedHeatmapProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { cue } = useSfx();
  const [phase, setPhase] = useState<StoryPhase>("idle");
  const [waveColumn, setWaveColumn] = useState(-1);
  const [litWeekCursor, setLitWeekCursor] = useState(-1);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearIntervalTimer = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (fn: () => void, ms: number) => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        fn();
      }, ms);
    },
    [clearTimer],
  );

  const resolvedPeakIndex = useMemo(
    () => resolvePeakIndex({ levels, dates, peakDate, peakIndex }),
    [levels, dates, peakDate, peakIndex],
  );

  const weekCount = Math.max(1, Math.ceil(levels.length / DAYS_PER_WEEK));
  const monthMarkers = useMemo(
    () => buildMonthMarkers(dates, weekCount, locale),
    [dates, weekCount, locale],
  );

  const hasPeakDay =
    resolvedPeakIndex != null && Boolean(peakDateLabel || peakCaption);
  const hasPeakMonth =
    peakMonth != null &&
    peakMonth >= 1 &&
    peakMonth <= 12 &&
    Boolean(peakMonthLabel || peakMonthCaption);
  const hasWeekday =
    Boolean(weekdayInsight) &&
    (weekdayInsight?.favoriteWeekdayIndex ?? -1) >= 0 &&
    (weekdayInsight?.favoriteWeekdayContributions ?? 0) > 0;
  const perfectIndexes = perfectWeeks?.weekIndexes ?? [];
  const hasPerfectWeeks = perfectIndexes.length > 0;
  const hasSummary = Boolean(averages);
  const favoriteRow = weekdayInsight?.favoriteWeekdayIndex ?? -1;

  const rank = phaseRank(phase);
  const showHighlights = rank >= phaseRank("peakDay") && rank < phaseRank("restore");
  const showPeak = showHighlights && rank >= phaseRank("peakDay") && hasPeakDay;
  const showMonth =
    showHighlights && rank >= phaseRank("peakMonth") && hasPeakMonth;
  const showWeekdayRow =
    showHighlights && rank >= phaseRank("weekdayWave") && hasWeekday;
  const showPerfect =
    showHighlights && rank >= phaseRank("weeksWave") && hasPerfectWeeks;

  useEffect(() => {
    if (phase === "peakDay") cue("record");
    else if (phase === "summary") cue("metric");
  }, [phase, cue]);

  const goAfterPeakDay = useCallback(() => {
    if (hasPeakMonth) {
      setPhase(monthTeaserLines.length > 0 ? "monthTeaser" : "peakMonth");
      return;
    }
    if (hasWeekday) {
      setPhase(
        weekdayTeaserLines.length > 0 ? "weekdayTeaser" : "weekdayWave",
      );
      return;
    }
    if (hasPerfectWeeks) {
      setPhase(weeksTeaserLines.length > 0 ? "weeksTeaser" : "weeksWave");
      return;
    }
    setPhase("mosaic");
  }, [
    hasPeakMonth,
    hasWeekday,
    hasPerfectWeeks,
    monthTeaserLines.length,
    weekdayTeaserLines.length,
    weeksTeaserLines.length,
  ]);

  const goAfterPeakMonth = useCallback(() => {
    if (hasWeekday) {
      setPhase(
        weekdayTeaserLines.length > 0 ? "weekdayTeaser" : "weekdayWave",
      );
      return;
    }
    if (hasPerfectWeeks) {
      setPhase(weeksTeaserLines.length > 0 ? "weeksTeaser" : "weeksWave");
      return;
    }
    setPhase("mosaic");
  }, [
    hasWeekday,
    hasPerfectWeeks,
    weekdayTeaserLines.length,
    weeksTeaserLines.length,
  ]);

  const goAfterWeekday = useCallback(() => {
    if (hasPerfectWeeks) {
      setPhase(weeksTeaserLines.length > 0 ? "weeksTeaser" : "weeksWave");
      return;
    }
    setPhase("mosaic");
  }, [hasPerfectWeeks, weeksTeaserLines.length]);

  const startWeekdayChapter = useCallback(() => {
    setWaveColumn(-1);
    setPhase("weekdayWave");
  }, []);

  const startWeeksChapter = useCallback(() => {
    setLitWeekCursor(-1);
    setPhase("weeksWave");
  }, []);

  useEffect(() => {
    setPhase("idle");
    setWaveColumn(-1);
    setLitWeekCursor(-1);
    clearTimer();
    clearIntervalTimer();

    if (reducedMotion) {
      setPhase("summary");
      return;
    }

    schedule(() => {
      if (hasPeakDay) {
        setPhase(teaserLines.length > 0 ? "dayTeaser" : "peakDay");
      } else {
        goAfterPeakDay();
      }
    }, STORY_INTRO_PAUSE_MS);

    return () => {
      clearTimer();
      clearIntervalTimer();
    };
  }, [
    levels.length,
    hasPeakDay,
    teaserLines.length,
    reducedMotion,
    schedule,
    clearTimer,
    clearIntervalTimer,
    goAfterPeakDay,
  ]);

  const handleDayTeaserComplete = useCallback(() => {
    if (reducedMotion || phase !== "dayTeaser") return;
    schedule(() => setPhase("peakDay"), POST_QUESTION_PAUSE_MS);
  }, [reducedMotion, phase, schedule]);

  const handleMonthTeaserComplete = useCallback(() => {
    if (reducedMotion || phase !== "monthTeaser") return;
    schedule(() => setPhase("peakMonth"), POST_QUESTION_PAUSE_MS);
  }, [reducedMotion, phase, schedule]);

  const handleWeekdayTeaserComplete = useCallback(() => {
    if (reducedMotion || phase !== "weekdayTeaser") return;
    schedule(() => startWeekdayChapter(), POST_QUESTION_PAUSE_MS);
  }, [reducedMotion, phase, schedule, startWeekdayChapter]);

  const handleWeeksTeaserComplete = useCallback(() => {
    if (reducedMotion || phase !== "weeksTeaser") return;
    schedule(() => startWeeksChapter(), POST_QUESTION_PAUSE_MS);
  }, [reducedMotion, phase, schedule, startWeeksChapter]);

  useEffect(() => {
    if (phase !== "peakDay" || reducedMotion) return;
    schedule(() => goAfterPeakDay(), PEAK_DAY_HOLD_MS);
    return clearTimer;
  }, [phase, reducedMotion, schedule, clearTimer, goAfterPeakDay]);

  useEffect(() => {
    if (phase !== "peakMonth" || reducedMotion) return;
    schedule(() => goAfterPeakMonth(), PEAK_MONTH_HOLD_MS);
    return clearTimer;
  }, [phase, reducedMotion, schedule, clearTimer, goAfterPeakMonth]);

  useEffect(() => {
    if (phase !== "weekdayWave" || reducedMotion || !hasWeekday) return;
    clearIntervalTimer();
    setWaveColumn(0);
    let column = 0;
    intervalRef.current = window.setInterval(() => {
      column += 1;
      if (column >= weekCount) {
        clearIntervalTimer();
        setWaveColumn(weekCount);
        setPhase("weekdayReveal");
        return;
      }
      setWaveColumn(column);
    }, WEEKDAY_WAVE_STAGGER_MS);
    return clearIntervalTimer;
  }, [phase, reducedMotion, hasWeekday, weekCount, clearIntervalTimer]);

  useEffect(() => {
    if (phase !== "weekdayReveal" || reducedMotion) return;
    schedule(() => goAfterWeekday(), WEEKDAY_REVEAL_HOLD_MS);
    return clearTimer;
  }, [phase, reducedMotion, schedule, clearTimer, goAfterWeekday]);

  useEffect(() => {
    if (phase !== "weeksWave" || reducedMotion || !hasPerfectWeeks) return;
    clearIntervalTimer();
    setLitWeekCursor(0);
    let cursor = 0;
    intervalRef.current = window.setInterval(() => {
      cursor += 1;
      if (cursor >= perfectIndexes.length) {
        clearIntervalTimer();
        setLitWeekCursor(perfectIndexes.length);
        setPhase("weeksReveal");
        return;
      }
      setLitWeekCursor(cursor);
    }, PERFECT_WEEK_STAGGER_MS);
    return clearIntervalTimer;
  }, [
    phase,
    reducedMotion,
    hasPerfectWeeks,
    perfectIndexes.length,
    clearIntervalTimer,
  ]);

  useEffect(() => {
    if (phase !== "weeksReveal" || reducedMotion) return;
    schedule(() => setPhase("mosaic"), PERFECT_WEEK_HOLD_MS);
    return clearTimer;
  }, [phase, reducedMotion, schedule, clearTimer]);

  useEffect(() => {
    if (phase !== "mosaic" || reducedMotion) return;
    schedule(() => setPhase("restore"), MOSAIC_HOLD_MS);
    return clearTimer;
  }, [phase, reducedMotion, schedule, clearTimer]);

  useEffect(() => {
    if (phase !== "restore" || reducedMotion) return;
    schedule(
      () => setPhase(hasSummary ? "summary" : "finale"),
      RESTORE_MS,
    );
    return clearTimer;
  }, [phase, reducedMotion, schedule, clearTimer, hasSummary]);

  useEffect(() => {
    if (phase !== "summary" || reducedMotion) return;
    schedule(() => setPhase("finale"), SUMMARY_HOLD_MS);
    return clearTimer;
  }, [phase, reducedMotion, schedule, clearTimer]);

  const litPerfectSet = useMemo(() => {
    if (!showPerfect) return new Set<number>();
    if (phase === "weeksReveal" || rank >= phaseRank("mosaic")) {
      return new Set(perfectIndexes);
    }
    return new Set(perfectIndexes.slice(0, Math.max(0, litWeekCursor + 1)));
  }, [showPerfect, phase, rank, perfectIndexes, litWeekCursor]);

  const showDayTeaser = phase === "dayTeaser";
  const showMonthTeaser = phase === "monthTeaser";
  const showWeekdayTeaser = phase === "weekdayTeaser";
  const showWeeksTeaser = phase === "weeksTeaser";
  const showPeakCard = phase === "peakDay";
  const showMonthCard = phase === "peakMonth";
  const showWeekdayCard = phase === "weekdayReveal";
  const showWeeksCard = phase === "weeksWave" || phase === "weeksReveal";
  const showMosaic = phase === "mosaic";
  const showSummary = phase === "summary";

  const perfectLabel =
    perfectWeeks && perfectWeeks.count === 1
      ? perfectWeekLabelSingular
      : perfectWeeksLabel;

  const gridStyle = {
    gridTemplateRows: "repeat(7, minmax(0, 1fr))",
    gridAutoFlow: "column" as const,
    gridAutoColumns: "minmax(0, 1fr)",
    ["--heatmap-weeks" as string]: String(weekCount),
  };

  return (
    <div className="wrapped-heatmap-stage relative w-full max-w-3xl shrink-0">
      <div className="glass-card relative w-full overflow-hidden rounded-xl p-3 md:p-4">
        <div
          className="relative mb-1.5 h-3.5 shrink-0 md:mb-2 md:h-4"
          aria-hidden
        >
          {monthMarkers.map((marker) => {
            const isPeakMonthLabel =
              showMonth && peakMonth === marker.month;
            return (
              <span
                key={`${marker.month}-${marker.weekIndex}`}
                className={`absolute top-0 font-display text-[9px] font-medium tracking-wide md:text-[10px] ${
                  isPeakMonthLabel
                    ? "font-semibold"
                    : "text-on-surface-variant/50"
                }`}
                style={{
                  left: `${((marker.weekIndex + 0.5) / weekCount) * 100}%`,
                  transform: "translateX(-50%)",
                  color: isPeakMonthLabel ? PEAK_MONTH_YELLOW : undefined,
                }}
              >
                {marker.label}
              </span>
            );
          })}
        </div>

        <div className="wrapped-heatmap-sizer relative w-full">
          <div className="wrapped-heatmap-grid" style={gridStyle}>
            {levels.map((level, index) => {
              const row = index % DAYS_PER_WEEK;
              const column = Math.floor(index / DAYS_PER_WEEK);

              const isPeak =
                showPeak &&
                resolvedPeakIndex != null &&
                index === resolvedPeakIndex;
              const isMonthBand =
                showMonth &&
                !isPeak &&
                peakMonth != null &&
                dateMonth(dates?.[index]) === peakMonth;

              const weekdayUnlocked =
                phase === "weekdayReveal" ||
                rank > phaseRank("weekdayReveal") ||
                (phase === "weekdayWave" && column <= waveColumn);
              const isWeekday =
                showWeekdayRow &&
                !isPeak &&
                !isMonthBand &&
                row === favoriteRow &&
                weekdayUnlocked;

              const isPerfect =
                showPerfect &&
                !isPeak &&
                litPerfectSet.has(column);

              const isWeekdayPulse =
                phase === "weekdayWave" &&
                hasWeekday &&
                row === favoriteRow &&
                column <= waveColumn &&
                column > waveColumn - 3;
              const isPerfectPulse =
                phase === "weeksWave" &&
                litWeekCursor >= 0 &&
                perfectIndexes[litWeekCursor] === column;

              const highlightColor = isPeak
                ? PEAK_DAY_RED
                : isPerfect
                  ? PERFECT_WEEK_MAGENTA
                  : isMonthBand
                    ? PEAK_MONTH_YELLOW
                    : isWeekday
                      ? WEEKDAY_HIGHLIGHT_BLUE
                      : null;

              return (
                <motion.div
                  key={dates?.[index] ?? index}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{
                    opacity: 1,
                    scale: isWeekdayPulse || isPerfectPulse ? [1, 1.28, 1] : 1,
                  }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : isWeekdayPulse || isPerfectPulse
                        ? {
                            duration: WEEKDAY_CELL_PULSE_MS / 1000,
                            ease: EASE,
                            times: [0, 0.4, 1],
                          }
                        : {
                            duration: 0.18,
                            delay: Math.min(index * 0.004, 0.75),
                            ease: "easeOut",
                          }
                  }
                  className={[
                    "wrapped-heatmap-cell relative",
                    highlightColor ? "" : HEATMAP_COLORS[level],
                    phase === "restore" ? "wrapped-heatmap-cell--restoring" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    highlightColor
                      ? {
                          backgroundColor: highlightColor,
                          boxShadow: `0 0 9px color-mix(in srgb, ${highlightColor} 50%, transparent)`,
                          zIndex: isPeak ? 4 : isPerfect ? 3 : 2,
                        }
                      : undefined
                  }
                  title={dates?.[index]}
                />
              );
            })}
          </div>
        </div>

        <div className="wrapped-heatmap-callout-slot relative z-10">
          {teaserLines.length > 0 ? (
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: showDayTeaser ? 1 : 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              aria-hidden={!showDayTeaser}
            >
              <TypewriterTeaser
                lines={teaserLines}
                active={showDayTeaser}
                reducedMotion={reducedMotion}
                onComplete={handleDayTeaserComplete}
              />
            </motion.div>
          ) : null}

          {monthTeaserLines.length > 0 ? (
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: showMonthTeaser ? 1 : 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              aria-hidden={!showMonthTeaser}
            >
              <TypewriterTeaser
                lines={monthTeaserLines}
                active={showMonthTeaser}
                reducedMotion={reducedMotion}
                onComplete={handleMonthTeaserComplete}
              />
            </motion.div>
          ) : null}

          {weekdayTeaserLines.length > 0 ? (
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: showWeekdayTeaser ? 1 : 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              aria-hidden={!showWeekdayTeaser}
            >
              <TypewriterTeaser
                lines={weekdayTeaserLines}
                active={showWeekdayTeaser}
                reducedMotion={reducedMotion}
                onComplete={handleWeekdayTeaserComplete}
              />
            </motion.div>
          ) : null}

          {weeksTeaserLines.length > 0 ? (
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: showWeeksTeaser ? 1 : 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              aria-hidden={!showWeeksTeaser}
            >
              <TypewriterTeaser
                lines={weeksTeaserLines}
                active={showWeeksTeaser}
                reducedMotion={reducedMotion}
                onComplete={handleWeeksTeaserComplete}
              />
            </motion.div>
          ) : null}

          {hasPeakDay ? (
            <motion.div
              className="wrapped-heatmap-callout-card absolute inset-x-0 top-1/2 mx-auto flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-white/10 text-center"
              initial={false}
              animate={{
                opacity: showPeakCard ? 1 : 0,
                y: showPeakCard ? 0 : 8,
              }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                pointerEvents: showPeakCard ? "auto" : "none",
                borderColor: `color-mix(in srgb, ${PEAK_DAY_RED} 35%, transparent)`,
              }}
              aria-hidden={!showPeakCard}
            >
              {peakDateLabel ? (
                <p
                  className="font-display text-[1.05rem] font-extrabold md:text-lg"
                  style={{ color: PEAK_DAY_RED }}
                >
                  {peakDateLabel}
                </p>
              ) : null}
              {peakCaption ? (
                <p className="i18n-text text-[11px] text-on-surface-variant md:text-sm">
                  {peakCaption}
                </p>
              ) : null}
              {typeof peakCount === "number" && peakCountLabel ? (
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className="font-display text-2xl font-extrabold"
                    style={{ color: PEAK_DAY_RED }}
                  >
                    {formatNumber(peakCount, locale)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {peakCountLabel}
                  </span>
                </p>
              ) : null}
            </motion.div>
          ) : null}

          {hasPeakMonth ? (
            <motion.div
              className="wrapped-heatmap-callout-card absolute inset-x-0 top-1/2 mx-auto flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-white/10 text-center"
              initial={false}
              animate={{
                opacity: showMonthCard ? 1 : 0,
                y: showMonthCard ? 0 : 8,
              }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                pointerEvents: showMonthCard ? "auto" : "none",
                borderColor: `color-mix(in srgb, ${PEAK_MONTH_YELLOW} 35%, transparent)`,
              }}
              aria-hidden={!showMonthCard}
            >
              {peakMonthLabel ? (
                <p
                  className="font-display text-[1.05rem] font-extrabold md:text-lg"
                  style={{ color: PEAK_MONTH_YELLOW }}
                >
                  {peakMonthLabel}
                </p>
              ) : null}
              {peakMonthCaption ? (
                <p className="i18n-text text-[11px] text-on-surface-variant md:text-sm">
                  {peakMonthCaption}
                </p>
              ) : null}
              {typeof peakMonthCount === "number" && peakMonthCountLabel ? (
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className="font-display text-2xl font-extrabold"
                    style={{ color: PEAK_MONTH_YELLOW }}
                  >
                    {formatNumber(peakMonthCount, locale)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {peakMonthCountLabel}
                  </span>
                </p>
              ) : null}
            </motion.div>
          ) : null}

          {hasWeekday && weekdayInsight ? (
            <motion.div
              className="wrapped-heatmap-callout-card absolute inset-x-0 top-1/2 mx-auto flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-white/10 text-center"
              initial={false}
              animate={{
                opacity: showWeekdayCard ? 1 : 0,
                y: showWeekdayCard ? 0 : 8,
              }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                pointerEvents: showWeekdayCard ? "auto" : "none",
                borderColor: `color-mix(in srgb, ${WEEKDAY_HIGHLIGHT_BLUE} 35%, transparent)`,
              }}
              aria-hidden={!showWeekdayCard}
            >
              {weekdayTitle ? (
                <p className="i18n-text text-[11px] text-on-surface-variant md:text-sm">
                  {weekdayTitle}
                </p>
              ) : null}
              <p
                className="font-display text-[1.15rem] font-extrabold md:text-xl"
                style={{ color: WEEKDAY_HIGHLIGHT_BLUE }}
              >
                {weekdayInsight.favoriteWeekdayLabel}
              </p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span
                  className="font-display text-2xl font-extrabold"
                  style={{ color: WEEKDAY_HIGHLIGHT_BLUE }}
                >
                  {formatNumber(
                    weekdayInsight.favoriteWeekdayContributions,
                    locale,
                  )}
                </span>
                {weekdayCountLabel ? (
                  <span className="text-xs text-on-surface-variant">
                    {weekdayCountLabel}
                  </span>
                ) : null}
              </p>
            </motion.div>
          ) : null}

          {hasPerfectWeeks && perfectWeeks ? (
            <motion.div
              className="wrapped-heatmap-callout-card absolute inset-x-0 top-1/2 mx-auto flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-white/10 text-center"
              initial={false}
              animate={{
                opacity: showWeeksCard ? 1 : 0,
                y: showWeeksCard ? 0 : 8,
              }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                pointerEvents: showWeeksCard ? "auto" : "none",
                borderColor: `color-mix(in srgb, ${PERFECT_WEEK_MAGENTA} 35%, transparent)`,
              }}
              aria-hidden={!showWeeksCard}
            >
              {perfectWeeksLead ? (
                <p className="i18n-text text-[11px] text-on-surface-variant md:text-sm">
                  {perfectWeeksLead}
                </p>
              ) : null}
              <p
                className="font-display text-3xl font-extrabold md:text-4xl"
                style={{ color: PERFECT_WEEK_MAGENTA }}
              >
                <AnimatedCounter
                  value={perfectWeeks.count}
                  locale={locale}
                  play={showWeeksCard}
                  durationMs={900}
                />
              </p>
              {perfectLabel ? (
                <p className="i18n-text text-[11px] text-on-surface-variant md:text-sm">
                  {perfectLabel}
                </p>
              ) : null}
            </motion.div>
          ) : null}

          {mosaicLine ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center px-4"
              initial={false}
              animate={{ opacity: showMosaic ? 1 : 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              aria-hidden={!showMosaic}
            >
              <p className="i18n-text text-center font-display text-lg font-semibold text-on-surface md:text-xl">
                {mosaicLine}
              </p>
            </motion.div>
          ) : null}

          {hasSummary && averages ? (
            <motion.div
              className="wrapped-heatmap-callout-card wrapped-heatmap-callout-card--summary absolute inset-x-0 bottom-0 mx-auto flex flex-col items-center rounded-xl border border-white/10 text-center"
              initial={false}
              animate={{
                opacity: showSummary ? 1 : 0,
                y: showSummary ? 0 : 10,
              }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{ pointerEvents: showSummary ? "auto" : "none" }}
              aria-hidden={!showSummary}
            >
              <div className="flex flex-col items-center leading-tight">
                {averageLead ? (
                  <p className="i18n-text text-[10px] text-on-surface-variant md:text-[11px]">
                    {averageLead}
                  </p>
                ) : null}
                <p className="font-display text-2xl font-extrabold text-primary md:text-[1.75rem]">
                  <AnimatedCounter
                    value={averages.averagePerActiveDay}
                    locale={locale}
                    play={showSummary}
                    durationMs={1100}
                    fractionDigits={1}
                  />
                </p>
                {averageLabel ? (
                  <p className="i18n-text text-[10px] text-on-surface-variant md:text-[11px]">
                    {averageLabel}
                  </p>
                ) : null}
              </div>

              <div className="flex w-full items-baseline justify-center gap-5">
                <div className="flex items-baseline gap-1.5">
                  <p className="font-display text-base font-bold text-on-surface md:text-lg">
                    <AnimatedCounter
                      value={averages.activeDays}
                      locale={locale}
                      play={showSummary}
                      durationMs={1000}
                    />
                  </p>
                  {activeDaysLead ? (
                    <p className="i18n-text text-[10px] text-on-surface-variant">
                      {activeDaysLead}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="font-display text-base font-bold text-on-surface md:text-lg">
                    <AnimatedCounter
                      value={averages.totalContributions}
                      locale={locale}
                      play={showSummary}
                      durationMs={1100}
                    />
                  </p>
                  {totalLead ? (
                    <p className="i18n-text text-[10px] text-on-surface-variant">
                      {totalLead}
                    </p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
