"use client";

import { motion } from "framer-motion";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

const DOTS = [
  { x: "12%", y: "22%", size: 3, delay: 0 },
  { x: "78%", y: "18%", size: 2, delay: 0.4 },
  { x: "22%", y: "72%", size: 2, delay: 0.8 },
  { x: "86%", y: "68%", size: 3, delay: 1.2 },
  { x: "48%", y: "14%", size: 2, delay: 0.2 },
  { x: "64%", y: "82%", size: 2, delay: 1.6 },
];

export function ErrorBackground() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <>
      <AmbientBackground />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {DOTS.map((dot) => (
          <motion.span
            key={`${dot.x}-${dot.y}`}
            className="absolute rounded-sm bg-primary/35"
            style={{
              left: dot.x,
              top: dot.y,
              width: dot.size,
              height: dot.size,
            }}
            animate={
              reducedMotion
                ? undefined
                : { y: [0, -8, 0], opacity: [0.25, 0.7, 0.25] }
            }
            transition={
              reducedMotion
                ? undefined
                : {
                    duration: 4.5,
                    repeat: Infinity,
                    delay: dot.delay,
                    ease: "easeInOut",
                  }
            }
          />
        ))}
      </div>
    </>
  );
}
