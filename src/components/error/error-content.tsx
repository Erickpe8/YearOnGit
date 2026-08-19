"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

export function ErrorContent({
  title,
  description,
  availability,
  requestId,
  referenceLabel,
}: {
  title: string;
  description: string;
  availability?: string | null;
  requestId?: string | null;
  referenceLabel?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-md"
    >
      <h1 className="font-display text-2xl font-extrabold text-on-surface max-[390px]:text-xl md:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
        {description}
      </p>
      {availability ? (
        <p className="mt-3 font-display text-xs font-semibold text-primary/90">
          {availability}
        </p>
      ) : null}
      {requestId ? (
        <p className="mt-3 font-mono text-[11px] text-on-surface-variant/80">
          {referenceLabel ?? `Reference: ${requestId}`}
        </p>
      ) : null}
    </motion.div>
  );
}
