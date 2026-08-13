"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import { StreakFire } from "@/components/wrapped/streak-fire";
import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";
import { IconCalendar, IconFlame } from "@/components/ui/icons";
import type { Locale } from "@/lib/i18n/supported-locales";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  formatWeekdayName,
  formatWrappedDate,
} from "@/lib/wrapped/format";
import type { WrappedStats } from "@/lib/wrapped/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

type StreakSlideProps = {
  stats: WrappedStats;
  locale: Locale;
  weekdayActivityPct: number;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const STACK_GAP = "gap-3";

export function StreakSlide({
  stats,
  locale,
  weekdayActivityPct,
  t,
}: StreakSlideProps) {
  const reducedMotion = usePrefersReducedMotion();
  const weekendPct = stats.weekendActivityPercentage;
  const weekdayName = stats.mostActiveWeekday
    ? formatWeekdayName(stats.mostActiveWeekday, locale)
    : null;

  const splitTotal = weekdayActivityPct + weekendPct;
  const weekdayShare =
    splitTotal > 0
      ? Math.round((weekdayActivityPct / splitTotal) * 1000) / 10
      : 50;
  const weekendShare = Math.round((100 - weekdayShare) * 10) / 10;

  const fadeUp = (delay: number) =>
    reducedMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.38, delay, ease: EASE },
        };

  const titleMotion = fadeUp(0.05);
  const heroMotion = fadeUp(0.12);
  const daysMotion = fadeUp(0.22);
  const rangeMotion = fadeUp(0.32);
  const dayMotion = fadeUp(0.42);
  const barMotion = fadeUp(0.52);

  return (
    <WrappedSlideShell
      slideKey="streak"
      centered={false}
      className="streak-slide"
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <motion.p
          className="i18n-text shrink-0 text-center font-display text-base text-on-surface-variant md:text-xl"
          initial={titleMotion.initial}
          animate={titleMotion.animate}
          transition={titleMotion.transition}
        >
          {t("longestStreak")}
        </motion.p>

        <motion.div
          className="relative mt-2 flex w-full shrink-0 flex-col items-center"
          initial={heroMotion.initial}
          animate={heroMotion.animate}
          transition={heroMotion.transition}
        >
          <div className="streak-hero-number relative flex items-center justify-center">
            <StreakFire />
            <div className="streak-hero-digit wrapped-stat-hero relative z-[1] font-display font-extrabold">
              <AnimatedCounter
                value={stats.longestStreak}
                locale={locale}
                durationMs={reducedMotion ? 0 : 1200}
              />
            </div>
          </div>

          <motion.p
            className="i18n-label relative z-[1] mt-1 font-display text-sm uppercase tracking-[0.14em] text-on-surface-variant md:text-lg"
            initial={daysMotion.initial}
            animate={daysMotion.animate}
            transition={daysMotion.transition}
          >
            {t("days")}
          </motion.p>
        </motion.div>

        <div
          className={`mt-3 flex w-full flex-col items-center ${STACK_GAP}`}
        >
          {stats.streakStartDate && stats.streakEndDate ? (
            <motion.div
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
              initial={rangeMotion.initial}
              animate={rangeMotion.animate}
              transition={rangeMotion.transition}
            >
              <IconCalendar className="h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="i18n-text truncate font-display text-[11px] font-medium text-on-surface md:text-sm">
                {t("streakHighlight", {
                  start:
                    formatWrappedDate(stats.streakStartDate, locale) ?? "",
                  end: formatWrappedDate(stats.streakEndDate, locale) ?? "",
                })}
              </p>
            </motion.div>
          ) : null}

          {weekdayName ? (
            <motion.div
              className="glass-card flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
              initial={dayMotion.initial}
              animate={dayMotion.animate}
              transition={dayMotion.transition}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <IconFlame className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="i18n-text text-[10px] uppercase tracking-[0.12em] text-on-surface-variant md:text-xs">
                  {t("streakActiveDayLabel")}
                </p>
                <p className="i18n-text font-display text-base font-bold capitalize text-primary md:text-lg">
                  {weekdayName}
                </p>
              </div>
            </motion.div>
          ) : null}

          <motion.div
            className="glass-card w-full rounded-xl px-3 py-3"
            initial={barMotion.initial}
            animate={barMotion.animate}
            transition={barMotion.transition}
          >
            <div className="mb-2 flex items-center justify-between gap-2 text-[11px] md:text-xs">
              <span className="i18n-text font-medium text-on-surface">
                {t("streakWeekdayLabel")}{" "}
                <span className="font-display font-bold text-primary">
                  {weekdayActivityPct}%
                </span>
              </span>
              <span className="i18n-text font-medium text-on-surface-variant">
                {t("streakWeekendLabel")}{" "}
                <span className="font-display font-bold text-[#f5c518]">
                  {weekendPct}%
                </span>
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full bg-primary"
                style={{
                  borderTopLeftRadius: 9999,
                  borderBottomLeftRadius: 9999,
                  borderTopRightRadius: weekendShare <= 0 ? 9999 : 0,
                  borderBottomRightRadius: weekendShare <= 0 ? 9999 : 0,
                }}
                initial={reducedMotion ? false : { width: 0 }}
                animate={{ width: `${weekdayShare}%` }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.7, delay: 0.65, ease: EASE }
                }
              />
              <motion.div
                className="h-full bg-[#f5c518]/85"
                style={{
                  borderTopRightRadius: 9999,
                  borderBottomRightRadius: 9999,
                  borderTopLeftRadius: weekdayShare <= 0 ? 9999 : 0,
                  borderBottomLeftRadius: weekdayShare <= 0 ? 9999 : 0,
                }}
                initial={reducedMotion ? false : { width: 0 }}
                animate={{ width: `${weekendShare}%` }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.7, delay: 0.72, ease: EASE }
                }
              />
            </div>
          </motion.div>
        </div>
      </div>
    </WrappedSlideShell>
  );
}
