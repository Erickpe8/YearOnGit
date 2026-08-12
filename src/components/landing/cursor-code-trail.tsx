"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const TRAIL_SYMBOLS = ["</>", "{", "}", "•"] as const;

const MAX_PARTICLES = 56;
const MIN_DISTANCE = 14;
const PARTICLES_PER_SPAWN = 2;

type TrailParticle = {
  id: number;
  x: number;
  y: number;
  symbol: (typeof TRAIL_SYMBOLS)[number];
  size: number;
  driftX: number;
  driftY: number;
  rotate: number;
};

function randomSymbol() {
  return TRAIL_SYMBOLS[Math.floor(Math.random() * TRAIL_SYMBOLS.length)];
}

export function CursorCodeTrail() {
  const [particles, setParticles] = useState<TrailParticle[]>([]);
  const idRef = useRef(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const reducedMotionRef = useRef(false);

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((particle) => particle.id !== id));
  }, []);

  const spawnParticle = useCallback((x: number, y: number) => {
    for (let i = 0; i < PARTICLES_PER_SPAWN; i += 1) {
      const id = ++idRef.current;
      const offsetX = (Math.random() - 0.5) * 16;
      const offsetY = (Math.random() - 0.5) * 16;

      setParticles((prev) => {
        const particle: TrailParticle = {
          id,
          x: x + offsetX,
          y: y + offsetY,
          symbol: randomSymbol(),
          size: 13 + Math.random() * 10,
          driftX: (Math.random() - 0.5) * 32,
          driftY: -(22 + Math.random() * 32),
          rotate: (Math.random() - 0.5) * 22,
        };

        const next = [...prev, particle];
        return next.length > MAX_PARTICLES
          ? next.slice(next.length - MAX_PARTICLES)
          : next;
      });

      window.setTimeout(() => removeParticle(id), 1100);
    }
  }, [removeParticle]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = media.matches;

    const onMotionPreferenceChange = () => {
      reducedMotionRef.current = media.matches;
      if (media.matches) {
        setParticles([]);
      }
    };

    const onMove = (event: MouseEvent) => {
      if (reducedMotionRef.current) return;

      const { clientX, clientY } = event;
      const last = lastPosRef.current;

      if (last) {
        const distance = Math.hypot(clientX - last.x, clientY - last.y);
        if (distance < MIN_DISTANCE) return;
      }

      lastPosRef.current = { x: clientX, y: clientY };
      spawnParticle(clientX, clientY);
    };

    media.addEventListener("change", onMotionPreferenceChange);
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      media.removeEventListener("change", onMotionPreferenceChange);
      window.removeEventListener("mousemove", onMove);
    };
  }, [spawnParticle]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[8] overflow-hidden"
      aria-hidden
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 font-mono font-medium text-[#39d353]/55"
            style={{
              left: particle.x,
              top: particle.y,
              fontSize: particle.size,
            }}
            initial={{ opacity: 0.9, scale: 0.9, rotate: 0 }}
            animate={{
              opacity: 0,
              scale: 1.12,
              x: particle.driftX,
              y: particle.driftY,
              rotate: particle.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, ease: "easeOut" }}
          >
            {particle.symbol}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
