"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/supported-locales";
import { formatNumber } from "@/lib/wrapped/format";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

type NumberBurstProps = {
  value: number;
  locale: Locale;
  active: boolean;
  className?: string;
};

type BurstParticle = {
  id: number;
  x: number;
  y: number;
  sizeVw: number;
  opacity: number;
  rotate: number;
  blur: number;
  delay: number;
  driftX: number;
  driftY: number;
  duration: number;
};

function particleCountForViewport(width: number): number {
  if (width < 640) return 22;
  if (width < 1024) return 34;
  return 48;
}

function buildParticles(count: number, seed: number): BurstParticle[] {
  const particles: BurstParticle[] = [];
  let s = Math.abs(Math.floor(seed * 1000)) + 1;

  const next = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  for (let i = 0; i < count; i += 1) {
    const angle = next() * Math.PI * 2;
    const radius = 8 + next() * 42;
    const cx = 50 + Math.cos(angle) * radius * (0.55 + next() * 0.55);
    const cy = 48 + Math.sin(angle) * radius * (0.45 + next() * 0.65);

    particles.push({
      id: i,
      x: Math.min(92, Math.max(6, cx)),
      y: Math.min(90, Math.max(10, cy)),
      sizeVw: 3.2 + next() * 9.5,
      opacity: 0.1 + next() * 0.1,
      rotate: (next() - 0.5) * 36,
      blur: next() > 0.62 ? 0.6 + next() * 1.8 : 0,
      delay: next() * 0.28,
      driftX: (next() - 0.5) * 4,
      driftY: (next() - 0.5) * 5 - 1.5,
      duration: 2.6 + next() * 1.4,
    });
  }

  return particles;
}

export function NumberBurst({
  value,
  locale,
  active,
  className = "",
}: NumberBurstProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [count, setCount] = useState(18);
  const label = useMemo(
    () => formatNumber(value, locale),
    [value, locale],
  );

  useEffect(() => {
    const update = () => setCount(particleCountForViewport(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const particles = useMemo(
    () => buildParticles(count, value),
    [count, value],
  );

  if (reducedMotion || !Number.isFinite(value)) return null;

  return (
    <AnimatePresence>
      {active ? (
        <div
          className={`number-burst pointer-events-none fixed inset-0 overflow-hidden ${className}`}
          aria-hidden
        >
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="number-burst__digit absolute font-display font-extrabold tabular-nums text-primary"
              initial={{
                opacity: 0,
                scale: 0.5,
                left: "50%",
                top: "46%",
                x: "-50%",
                y: "-50%",
                rotate: 0,
              }}
              animate={{
                opacity: [0, particle.opacity, particle.opacity, 0],
                scale: [0.5, 1.02, 1, 0.97],
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                x: ["-50%", "-50%", `calc(-50% + ${particle.driftX}vw)`],
                y: ["-50%", "-50%", `calc(-50% + ${particle.driftY}vh)`],
                rotate: particle.rotate,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.7, ease: "easeOut" },
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.18, 0.72, 1],
              }}
              style={{
                fontSize: `clamp(1.1rem, ${particle.sizeVw}vw, 5.5rem)`,
                filter: particle.blur ? `blur(${particle.blur}px)` : undefined,
                willChange: "transform, opacity",
              }}
            >
              {label}
            </motion.span>
          ))}
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export const HIGHLIGHT_BURST_SETTLE_MS = 4_200;
