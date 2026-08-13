"use client";

import { useCallback, useRef } from "react";

const SWIPE_THRESHOLD = 48;
const SWIPE_MAX_VERTICAL = 80;

type SwipeHandlers = {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
};

export function useSwipeNavigation(
  onNext: () => void,
  onPrev: () => void,
  enabled = true,
): SwipeHandlers {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      startRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !startRef.current) return;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - startRef.current.x;
      const dy = touch.clientY - startRef.current.y;
      startRef.current = null;

      if (Math.abs(dy) > SWIPE_MAX_VERTICAL) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      if (dx < 0) onNext();
      else onPrev();
    },
    [enabled, onNext, onPrev],
  );

  return { onTouchStart, onTouchEnd };
}
