"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

export function ErrorCode({ code }: { code: string | number }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.p
      initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glow-text font-display text-6xl font-extrabold tracking-tight text-primary max-[390px]:text-5xl md:text-7xl"
    >
      {code}
    </motion.p>
  );
}
