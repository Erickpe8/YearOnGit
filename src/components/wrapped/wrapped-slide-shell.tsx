"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

type WrappedSlideShellProps = {
  slideKey: string;
  children: ReactNode;
  className?: string;
  centered?: boolean;
};

export function WrappedSlideShell({
  slideKey,
  children,
  className = "",
  centered = true,
}: WrappedSlideShellProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.section
      key={slideKey}
      initial={reducedMotion ? false : { opacity: 0, x: 36 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, x: -36 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
      }
      className={`wrapped-slide ${centered ? "wrapped-slide--center" : ""} ${className}`}
    >
      <div className="wrapped-slide-inner">{children}</div>
    </motion.section>
  );
}
