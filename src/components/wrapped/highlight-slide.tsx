"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NumberBurst } from "@/components/wrapped/number-burst";
import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { Locale } from "@/lib/i18n/supported-locales";
import {
  isHighlightTemplateKey,
  resolveHighlightValues,
} from "@/lib/wrapped/format-highlight";
import type { Highlight } from "@/lib/wrapped/modules/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

type HighlightSlideProps = {
  highlight: Highlight;
  locale: Locale;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const TEXT_REVEAL_MS = 450;
const POST_REVEAL_PAUSE_MS = 550;
const BURST_HOLD_MS = 2_800;

const CONFETTI_COLORS = [
  "#39d353",
  "#56d364",
  "#9be9a8",
  "#a2c9ff",
  "#ffffff",
];

export function getHighlightBurstValue(highlight: Highlight): number | null {
  for (const key of ["count", "stars", "days", "percent"] as const) {
    const raw = highlight.values[key];
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      return raw;
    }
  }
  return null;
}

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
      particleCount: 36,
      spread: 58,
      startVelocity: 26,
      origin: { x, y },
      scalar: 0.85,
    });
    confetti({
      ...shared,
      particleCount: 18,
      angle: 60,
      spread: 42,
      startVelocity: 22,
      origin: { x: Math.max(0.12, x - 0.12), y },
      scalar: 0.7,
    });
    confetti({
      ...shared,
      particleCount: 18,
      angle: 120,
      spread: 42,
      startVelocity: 22,
      origin: { x: Math.min(0.88, x + 0.12), y },
      scalar: 0.7,
    });
  });
}

export function HighlightSlide({ highlight, locale, t }: HighlightSlideProps) {
  const reducedMotion = usePrefersReducedMotion();
  const values = resolveHighlightValues(highlight, locale);
  const templateKey = isHighlightTemplateKey(highlight.templateKey)
    ? highlight.templateKey
    : null;
  const burstValue = useMemo(
    () => getHighlightBurstValue(highlight),
    [highlight],
  );

  const titleRef = useRef<HTMLHeadingElement>(null);
  const confettiFiredRef = useRef(false);
  const [burstActive, setBurstActive] = useState(false);

  const fireConfetti = useCallback(() => {
    if (reducedMotion || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    burstConfetti(titleRef.current);
  }, [reducedMotion]);

  useEffect(() => {
    confettiFiredRef.current = false;
    setBurstActive(false);
    if (reducedMotion || burstValue == null) return;

    const confettiTimer = window.setTimeout(() => {
      fireConfetti();
      setBurstActive(true);
    }, TEXT_REVEAL_MS + POST_REVEAL_PAUSE_MS);

    const clearBurst = window.setTimeout(() => {
      setBurstActive(false);
    }, TEXT_REVEAL_MS + POST_REVEAL_PAUSE_MS + BURST_HOLD_MS);

    return () => {
      window.clearTimeout(confettiTimer);
      window.clearTimeout(clearBurst);
    };
  }, [burstValue, fireConfetti, highlight.id, reducedMotion]);

  return (
    <>
      {burstValue != null ? (
        <NumberBurst
          value={burstValue}
          locale={locale}
          active={burstActive}
        />
      ) : null}

      <WrappedSlideShell
        slideKey={`highlight-${highlight.id}`}
        className="relative z-10"
      >
        <p className="i18n-text relative z-10 shrink-0 font-display text-xs uppercase tracking-[0.2em] text-primary md:text-sm">
          {t("highlightEyebrow")}
        </p>
        <motion.h2
          ref={titleRef}
          className="i18n-text glow-text relative z-10 max-w-lg shrink-0 text-center font-display text-2xl font-extrabold leading-tight text-on-surface md:text-4xl"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.45 }}
        >
          {templateKey ? t(templateKey, values) : highlight.templateKey}
        </motion.h2>
        <p className="i18n-text wrapped-compact-hide relative z-10 max-w-sm shrink-0 text-center text-xs text-on-surface-variant md:text-sm">
          {t("highlightFootnote")}
        </p>
      </WrappedSlideShell>
    </>
  );
}
