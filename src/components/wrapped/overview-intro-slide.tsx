"use client";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import { MUSIC_BUILD_LEAD_MS } from "@/lib/audio/score";
import type { TranslationKey } from "@/lib/i18n/translations";
import { formatNumber } from "@/lib/wrapped/format";
import type { WrappedStats } from "@/lib/wrapped/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";
import { useSfx } from "@/providers/sfx-provider";
import { burstConfettiFromElement } from "@/lib/wrapped/burst-confetti";
import { useWrappedUi } from "@/lib/wrapped/wrapped-ui";

type TranslationValues = Record<string, string | number>;

type OverviewIntroSlideProps = {
  stats: WrappedStats;
  displayName: string;
  locale: string;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CONFETTI_COLORS = [
  "#39d353",
  "#56d364",
  "#9be9a8",
  "#26a641",
  "#ffffff",
];

const STEP = {
  eyebrow: 0,
  username: 400,
  hero: 900,
  heroNote: 2_100,
  commits: 2_800,
  commitsNote: 3_700,
  collab: 4_400,
  collabNote: 5_200,
  repos: 5_900,
  reposNote: 6_600,
  languages: 7_200,
  languagesNote: 7_900,
} as const;

function Reveal({
  show,
  reducedMotion,
  className = "",
  children,
}: {
  show: boolean;
  reducedMotion: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{
        opacity: show ? 1 : 0,
        y: show || reducedMotion ? 0 : 8,
      }}
      transition={
        reducedMotion ? { duration: 0 } : { duration: 0.38, ease: EASE }
      }
      aria-hidden={!show}
      style={{ pointerEvents: show ? "auto" : "none" }}
    >
      {children}
    </motion.div>
  );
}

function useRevealStep(reducedMotion: boolean): number {
  const [step, setStep] = useState(reducedMotion ? Number.POSITIVE_INFINITY : -1);

  useEffect(() => {
    if (reducedMotion) {
      setStep(Number.POSITIVE_INFINITY);
      return;
    }

    setStep(-1);
    const timers = Object.values(STEP).map((delay) =>
      window.setTimeout(() => {
        setStep((current) => Math.max(current, delay));
      }, delay),
    );

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [reducedMotion]);

  return step;
}

function burstIntroConfetti(element: HTMLElement | null) {
  burstConfettiFromElement(
    element,
    (fire, origin) => {
      const shared = {
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true,
      };

      fire({
        ...shared,
        particleCount: 55,
        angle: 60,
        spread: 58,
        startVelocity: 38,
        origin: { x: Math.max(0.12, origin.x - 0.04), y: origin.y },
      });
      fire({
        ...shared,
        particleCount: 55,
        angle: 120,
        spread: 58,
        startVelocity: 38,
        origin: { x: Math.min(0.88, origin.x + 0.04), y: origin.y },
      });
      fire({
        ...shared,
        particleCount: 40,
        spread: 100,
        startVelocity: 28,
        origin,
        scalar: 0.9,
      });
    },
    0.32,
  );
}

export function OverviewIntroSlide({
  stats,
  displayName,
  locale,
  t,
}: OverviewIntroSlideProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { cue } = useSfx();
  const { features } = useWrappedUi();
  const step = useRevealStep(reducedMotion);
  const shown = (at: number) => reducedMotion || step >= at;
  const heroValueRef = useRef<HTMLParagraphElement>(null);
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (reducedMotion || step !== STEP.hero) return;
    const timer = window.setTimeout(
      () => cue("build"),
      Math.max(0, 1_100 - MUSIC_BUILD_LEAD_MS),
    );
    return () => window.clearTimeout(timer);
  }, [cue, reducedMotion, step]);

  const handleHeroCountComplete = useCallback(() => {
    if (reducedMotion || !features.confetti || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    cue("celebrate");
    burstIntroConfetti(heroValueRef.current);
  }, [features.confetti, reducedMotion, cue]);

  const commitsLeadCode =
    stats.totalContributions > 0 &&
    stats.totalCommits / stats.totalContributions >= 0.55;
  const hasCollab = stats.totalPullRequests > 0 || stats.totalIssues > 0;
  const hasRepos = stats.activeRepositories > 0;
  const hasLanguages = stats.languageCount > 0;

  const heroNote =
    stats.activeDays > 0
      ? t("overviewActiveDaysNote", {
          days: formatNumber(stats.activeDays, locale),
        })
      : stats.totalContributions >= 2000
        ? t("overviewVolumeNote", {
            count: formatNumber(
              Math.floor(stats.totalContributions / 1000) * 1000,
              locale,
            ),
          })
        : t("overviewContributionsNote", {
            count: formatNumber(stats.totalContributions, locale),
            year: "2026",
          });

  return (
    <div className="overview-intro mx-auto flex w-full max-w-md flex-col items-center text-center">
      <div className="overview-intro__eyebrow">
        <Reveal show={shown(STEP.eyebrow)} reducedMotion={reducedMotion}>
          <p className="i18n-text font-display text-[0.7rem] uppercase tracking-[0.14em] text-primary md:text-xs">
            {t("your2026")}
          </p>
        </Reveal>
      </div>

      <div className="overview-intro__username">
        <Reveal show={shown(STEP.username)} reducedMotion={reducedMotion}>
          <h2 className="glow-text wrapped-hero-title font-display font-extrabold text-on-surface">
            @{displayName}
          </h2>
        </Reveal>
      </div>

      <div className="overview-intro__hero">
        <Reveal show={shown(STEP.hero)} reducedMotion={reducedMotion}>
          <p
            ref={heroValueRef}
            className="overview-intro__hero-value font-display font-extrabold leading-none text-primary"
          >
            <AnimatedCounter
              value={stats.totalContributions}
              locale={locale}
              durationMs={1_100}
              play={shown(STEP.hero)}
              onComplete={handleHeroCountComplete}
            />
          </p>
          <p className="mt-1.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-on-surface md:text-base">
            {t("totalContributions")}
          </p>
        </Reveal>
        <div className="overview-intro__hero-note">
          <Reveal show={shown(STEP.heroNote)} reducedMotion={reducedMotion}>
            <p className="i18n-text text-[11px] leading-snug text-on-surface-variant md:text-xs">
              {heroNote}
            </p>
          </Reveal>
        </div>
      </div>

      <div className="overview-intro__divider" aria-hidden />

      <div className="glass-card overview-intro__card w-full rounded-2xl text-left">
        <div className="overview-intro__metric">
          <Reveal show={shown(STEP.commits)} reducedMotion={reducedMotion}>
            <div className="overview-intro__metric-row">
              <span className="overview-intro__metric-value text-primary">
                <AnimatedCounter
                  value={stats.totalCommits}
                  locale={locale}
                  durationMs={900}
                  play={shown(STEP.commits)}
                />
              </span>
              <span className="overview-intro__metric-label">
                {t("overviewCommitsLabel")}
              </span>
            </div>
          </Reveal>
          <div className="overview-intro__metric-note">
            <Reveal
              show={shown(STEP.commitsNote) && commitsLeadCode}
              reducedMotion={reducedMotion}
            >
              <p className="i18n-text text-[10px] leading-snug text-on-surface-variant md:text-[11px]">
                {t("overviewCommitsNote")}
              </p>
            </Reveal>
          </div>
        </div>

        <div className="overview-intro__metric">
          <Reveal show={shown(STEP.collab)} reducedMotion={reducedMotion}>
            <div className="overview-intro__metric-pair">
              <div className="overview-intro__metric-row">
                <span className="overview-intro__metric-value text-primary">
                  <AnimatedCounter
                    value={stats.totalPullRequests}
                    locale={locale}
                    durationMs={750}
                    play={shown(STEP.collab)}
                  />
                </span>
                <span className="overview-intro__metric-label">
                  {t("overviewPrsLabel")}
                </span>
              </div>
              <div className="overview-intro__metric-row">
                <span className="overview-intro__metric-value text-primary">
                  <AnimatedCounter
                    value={stats.totalIssues}
                    locale={locale}
                    durationMs={750}
                    play={shown(STEP.collab)}
                  />
                </span>
                <span className="overview-intro__metric-label">
                  {t("overviewIssuesLabel")}
                </span>
              </div>
            </div>
          </Reveal>
          <div className="overview-intro__metric-note">
            <Reveal
              show={shown(STEP.collabNote) && hasCollab}
              reducedMotion={reducedMotion}
            >
              <p className="i18n-text text-[10px] leading-snug text-on-surface-variant md:text-[11px]">
                {t("overviewCollabNote")}
              </p>
            </Reveal>
          </div>
        </div>

        <div className="overview-intro__metric">
          <Reveal show={shown(STEP.repos)} reducedMotion={reducedMotion}>
            <div className="overview-intro__metric-row">
              <span className="overview-intro__metric-value text-primary">
                <AnimatedCounter
                  value={stats.activeRepositories}
                  locale={locale}
                  durationMs={700}
                  play={shown(STEP.repos)}
                />
              </span>
              <span className="overview-intro__metric-label">
                {t("overviewReposLabel")}
              </span>
            </div>
          </Reveal>
          <div className="overview-intro__metric-note">
            <Reveal
              show={shown(STEP.reposNote) && hasRepos}
              reducedMotion={reducedMotion}
            >
              <p className="i18n-text text-[10px] leading-snug text-on-surface-variant md:text-[11px]">
                {t("overviewReposNote")}
              </p>
            </Reveal>
          </div>
        </div>

        <div className="overview-intro__metric overview-intro__metric--last">
          <Reveal show={shown(STEP.languages)} reducedMotion={reducedMotion}>
            <div className="overview-intro__metric-row">
              <span className="overview-intro__metric-value text-primary">
                <AnimatedCounter
                  value={stats.languageCount}
                  locale={locale}
                  durationMs={700}
                  play={shown(STEP.languages)}
                />
              </span>
              <span className="overview-intro__metric-label">
                {t("overviewLanguagesLabel")}
              </span>
            </div>
          </Reveal>
          <div className="overview-intro__metric-note">
            <Reveal
              show={shown(STEP.languagesNote) && hasLanguages}
              reducedMotion={reducedMotion}
            >
              <p className="i18n-text text-[10px] leading-snug text-on-surface-variant md:text-[11px]">
                {t("overviewLanguagesNote")}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
