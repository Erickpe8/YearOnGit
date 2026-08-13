"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/wrapped/format";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

type AnimatedCounterProps = {
  value: number;
  locale: string;
  className?: string;
  durationMs?: number;
  play?: boolean;
  fractionDigits?: number;
  suffix?: string;
  onComplete?: () => void;
};

export function AnimatedCounter({
  value,
  locale,
  className = "",
  durationMs = 900,
  play = true,
  fractionDigits = 0,
  suffix = "",
  onComplete,
}: AnimatedCounterProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!play) {
      setDisplay(0);
      return;
    }

    if (reducedMotion) {
      setDisplay(value);
      onCompleteRef.current?.();
      return;
    }

    let frame = 0;
    let completed = false;
    const start = performance.now();
    const factor = 10 ** fractionDigits;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased * factor) / factor);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
        if (!completed) {
          completed = true;
          onCompleteRef.current?.();
        }
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reducedMotion, durationMs, play, fractionDigits]);

  const formatted = formatNumber(
    reducedMotion && play ? value : display,
    locale,
    {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits > 0 ? fractionDigits : 0,
    },
  );

  return (
    <span className={className}>
      {formatted}
      {suffix}
    </span>
  );
}
