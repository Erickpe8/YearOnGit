"use client";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  buildFavoriteRepoRace,
  QUIZ_ANSWER_WAIT_MS,
  type FavoriteRepoOption,
  type FavoriteRepoRace,
} from "@/lib/wrapped/favorite-repo-race";
import { formatNumber } from "@/lib/wrapped/format";
import type { WrappedStats } from "@/lib/wrapped/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";
import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";

type TranslationValues = Record<string, string | number>;

export type FavoriteRepoRaceHandle = {
  tryAdvance: () => boolean;
  trySelectWithEnter: () => boolean;
};

type FavoriteRepoRaceSlideProps = {
  stats: WrappedStats;
  locale: string;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  storyRef?: Ref<FavoriteRepoRaceHandle | null>;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const REPO_YELLOW = "#f5c518";

const CONFETTI_COLORS = [
  "#39d353",
  "#56d364",
  "#9be9a8",
  "#f5c518",
  "#ffffff",
];

type Phase = "prompt" | "reveal" | "done";

function burstConfetti(element: HTMLElement | null) {
  const rect = element?.getBoundingClientRect();
  const x = rect
    ? (rect.left + rect.width / 2) / window.innerWidth
    : 0.5;
  const y = rect
    ? (rect.top + rect.height / 2) / window.innerHeight
    : 0.42;

  void import("canvas-confetti").then((mod) => {
    const confetti = mod.default;
    const shared = {
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
      zIndex: 40,
    };
    confetti({
      ...shared,
      particleCount: 28,
      angle: 60,
      spread: 46,
      startVelocity: 28,
      origin: { x: Math.max(0.14, x - 0.08), y },
      scalar: 0.72,
    });
    confetti({
      ...shared,
      particleCount: 28,
      angle: 120,
      spread: 46,
      startVelocity: 28,
      origin: { x: Math.min(0.86, x + 0.08), y },
      scalar: 0.72,
    });
  });
}

export function FavoriteRepoRaceSlide({
  stats,
  locale,
  t,
  storyRef,
}: FavoriteRepoRaceSlideProps) {
  const reducedMotion = usePrefersReducedMotion();
  const race = useMemo(() => buildFavoriteRepoRace(stats), [stats]);

  if (!race) {
    return (
      <WrappedSlideShell slideKey="favorite-repo-empty">
        <p className="i18n-text text-center text-on-surface-variant">
          {t("raceNoData")}
        </p>
      </WrappedSlideShell>
    );
  }

  return (
    <QuizExperience
      race={race}
      locale={locale}
      t={t}
      storyRef={storyRef}
      reducedMotion={reducedMotion}
    />
  );
}

function QuizExperience({
  race,
  locale,
  t,
  storyRef,
  reducedMotion,
}: {
  race: FavoriteRepoRace;
  locale: string;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  storyRef?: Ref<FavoriteRepoRaceHandle | null>;
  reducedMotion: boolean;
}) {
  const isQuiz = race.mode === "quiz";
  const [phase, setPhase] = useState<Phase>(() => {
    if (reducedMotion) return "done";
    return isQuiz ? "prompt" : "reveal";
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    reducedMotion && isQuiz
      ? race.options.find((o) => o.isCorrect)?.id ?? null
      : null,
  );
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(
    reducedMotion || !isQuiz ? true : null,
  );
  const [focusIndex, setFocusIndex] = useState(0);
  const [locked, setLocked] = useState(reducedMotion || !isQuiz);

  const cardRef = useRef<HTMLDivElement>(null);
  const confettiFiredRef = useRef(false);
  const answeredRef = useRef(reducedMotion || !isQuiz);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const fireConfetti = useCallback(() => {
    if (reducedMotion || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    burstConfetti(cardRef.current);
  }, [reducedMotion]);

  const beginReveal = useCallback(
    (option: FavoriteRepoOption | null, correct: boolean) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      setLocked(true);
      setSelectedId(option?.id ?? null);
      setWasCorrect(correct);
      setPhase("reveal");
      window.setTimeout(() => fireConfetti(), reducedMotion ? 0 : 80);
      window.setTimeout(() => setPhase("done"), reducedMotion ? 0 : 2_200);
    },
    [fireConfetti, reducedMotion],
  );

  const selectOption = useCallback(
    (option: FavoriteRepoOption) => {
      if (phaseRef.current !== "prompt" || answeredRef.current) return;
      beginReveal(option, option.isCorrect);
    },
    [beginReveal],
  );

  useEffect(() => {
    if (isQuiz || reducedMotion) return;
    const timers = [
      window.setTimeout(() => fireConfetti(), 400),
      window.setTimeout(() => setPhase("done"), 2_200),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [fireConfetti, isQuiz, reducedMotion]);

  // Backup if animationend never fires (e.g. CSS kills the timer animation).
  useEffect(() => {
    if (!isQuiz || reducedMotion) return;
    if (phase !== "prompt" || answeredRef.current) return;
    const timer = window.setTimeout(() => {
      beginReveal(null, false);
    }, QUIZ_ANSWER_WAIT_MS + 50);
    return () => window.clearTimeout(timer);
  }, [beginReveal, isQuiz, phase, reducedMotion]);

  const onTimerEnded = useCallback(() => {
    if (phaseRef.current !== "prompt" || answeredRef.current) return;
    beginReveal(null, false);
  }, [beginReveal]);

  useImperativeHandle(
    storyRef,
    () => ({
      tryAdvance: () => phaseRef.current !== "done",
      trySelectWithEnter: () => {
        if (phaseRef.current !== "prompt" || answeredRef.current) return false;
        const option = race.options[focusIndex];
        if (!option) return false;
        selectOption(option);
        return true;
      },
    }),
    [focusIndex, race.options, selectOption],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phaseRef.current !== "prompt" || answeredRef.current) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        setFocusIndex((index) => {
          const len = race.options.length;
          if (len === 0) return 0;
          return event.key === "ArrowDown"
            ? (index + 1) % len
            : (index - 1 + len) % len;
        });
      }
      if (event.key >= "1" && event.key <= "3") {
        const option = race.options[Number(event.key) - 1];
        if (option) {
          event.preventDefault();
          selectOption(option);
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [race.options, selectOption]);

  const showPrompt = isQuiz && phase === "prompt";
  const showResult = phase === "reveal" || phase === "done";

  const optionState = (option: FavoriteRepoOption) => {
    if (showResult) {
      if (option.isCorrect) return "correct";
      if (selectedId === option.id && !option.isCorrect) return "wrong";
      return "dim";
    }
    return option.id === race.options[focusIndex]?.id ? "focus" : "idle";
  };

  return (
    <WrappedSlideShell
      slideKey="favorite-repo-quiz"
      className="wrapped-slide--race"
    >
      <div className={`repo-quiz${showResult ? " is-revealed" : ""}`}>
        <div className="repo-quiz__content">
          <p className="i18n-text repo-quiz__title font-display font-bold text-primary">
            {t("raceTitle")}
          </p>

          {showPrompt && (
            <motion.div
              className="repo-quiz__prompt"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <h2 className="i18n-text repo-quiz__question font-display font-extrabold text-on-surface">
                {t("raceQuestion")}
              </h2>

              {phase === "prompt" && !reducedMotion && (
                <div className="repo-quiz__timer" aria-hidden>
                  <span
                    className="repo-quiz__timer-bar"
                    style={{ animationDuration: `${QUIZ_ANSWER_WAIT_MS}ms` }}
                    onAnimationEnd={onTimerEnded}
                  />
                </div>
              )}

              <div
                className="repo-quiz__options"
                role="listbox"
                aria-label={t("raceQuestion")}
              >
                {race.options.map((option, index) => {
                  const state = optionState(option);
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={selectedId === option.id}
                      data-wrapped-nav-ignore
                      data-state={state}
                      className="repo-quiz__option"
                      disabled={locked}
                      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        ease: EASE,
                        delay: reducedMotion ? 0 : 0.12 + index * 0.1,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectOption(option);
                      }}
                      onFocus={() => setFocusIndex(index)}
                    >
                      <span className="repo-quiz__option-name font-display">
                        {option.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {showResult && (
            <motion.div
              ref={cardRef}
              className="repo-quiz__result"
              initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {isQuiz && wasCorrect === true && (
                <p className="i18n-text repo-quiz__verdict font-display font-bold text-primary">
                  {t("raceCorrect")}
                </p>
              )}
              {isQuiz && wasCorrect === false && (
                <p className="i18n-text repo-quiz__verdict font-display font-bold text-primary">
                  {t("raceDiscover")}
                </p>
              )}

              <p
                className="repo-quiz__winner-name font-display font-extrabold"
                style={{
                  color: REPO_YELLOW,
                  textShadow: `0 0 22px color-mix(in srgb, ${REPO_YELLOW} 40%, transparent)`,
                }}
              >
                {race.winner.name}
              </p>
              <p className="repo-quiz__commits font-display font-bold text-on-surface">
                <AnimatedCounter
                  value={race.winner.contributions}
                  locale={locale}
                  play={showResult}
                  durationMs={1_100}
                />{" "}
                <span className="text-on-surface-variant">
                  {t("raceCommitsLabel")}
                </span>
              </p>
              {race.winner.pctOfCommits > 0 && (
                <p className="i18n-text repo-quiz__meta text-on-surface-variant">
                  {t("raceCommitShare", {
                    percent: formatNumber(race.winner.pctOfCommits, locale, {
                      maximumFractionDigits: 1,
                      minimumFractionDigits: 0,
                    }),
                  })}
                </p>
              )}
              {race.winner.primaryLanguage && (
                <p className="i18n-text repo-quiz__meta repo-quiz__lang text-on-surface-variant">
                  <span
                    className="repo-quiz__lang-dot"
                    style={{
                      background:
                        race.winner.primaryLanguageColor ?? "#8b949e",
                    }}
                  />
                  {t("racePrimaryLanguage", {
                    language: race.winner.primaryLanguage,
                  })}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </WrappedSlideShell>
  );
}
