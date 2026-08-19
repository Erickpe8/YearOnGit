"use client";

import { motion } from "framer-motion";
import type { ErrorMood } from "@/lib/errors/catalog";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

const LABELS: Record<ErrorMood, string> = {
  search: "searching",
  lock: "locked",
  auth: "sign-in required",
  expire: "expired",
  reject: "rejected",
  wait: "waiting",
  broken: "broken",
  gateway: "unreachable",
  rest: "resting",
  timeout: "timed out",
};

export function ErrorIllustration({
  mood,
  emphasized = false,
}: {
  mood: ErrorMood;
  emphasized?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const float = reducedMotion
    ? undefined
    : { y: [0, emphasized ? -7 : -5, 0], rotate: [0, mood === "broken" ? -2 : 1.4, 0] };

  return (
    <motion.div
      role="img"
      aria-label={LABELS[mood]}
      className="relative mx-auto grid h-28 w-28 place-items-center max-[390px]:h-24 max-[390px]:w-24"
      animate={float}
      transition={
        reducedMotion
          ? undefined
          : { duration: mood === "wait" ? 2.4 : 5, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl" />
      <svg viewBox="0 0 96 96" className="relative h-[88%] w-[88%]" aria-hidden>
        <rect
          x="22"
          y="26"
          width="52"
          height="48"
          rx="14"
          fill="#0d1117"
          stroke="#39d353"
          strokeWidth="2.5"
        />
        <circle cx="40" cy="46" r="3.2" fill="#39d353" />
        <circle cx="56" cy="46" r="3.2" fill="#39d353" />
        <path
          d={mood === "broken" ? "M38 62h8l2-6 4 10 4-6h4" : "M38 61c4 4 16 4 20 0"}
          fill="none"
          stroke="#39d353"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {mood === "search" ? (
          <g>
            <circle cx="70" cy="70" r="9" fill="none" stroke="#8b949e" strokeWidth="2.4" />
            <path d="M76 76l8 8" stroke="#8b949e" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        ) : null}
        {mood === "lock" || mood === "auth" ? (
          <path
            d="M64 20v6a8 8 0 0 1 16 0v6"
            fill="none"
            stroke="#8b949e"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ) : null}
        {mood === "wait" ? (
          <g>
            <circle cx="76" cy="22" r="8" fill="none" stroke="#39d353" strokeWidth="2" />
            <path d="M76 17v5l3 3" stroke="#39d353" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : null}
        {mood === "rest" ? (
          <text x="66" y="22" fill="#39d353" fontSize="10" fontFamily="ui-sans-serif">
            zzz
          </text>
        ) : null}
        {mood === "broken" || mood === "gateway" ? (
          <path d="M48 18l3 10h-6l4 12" fill="none" stroke="#f85149" strokeWidth="2.2" />
        ) : null}
        {mood === "expire" || mood === "timeout" ? (
          <path
            d="M68 16h16M76 16v12"
            stroke="#8b949e"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ) : null}
        {mood === "reject" ? (
          <path d="M70 18l12 12M82 18L70 30" stroke="#f85149" strokeWidth="2.4" strokeLinecap="round" />
        ) : null}
      </svg>
    </motion.div>
  );
}
