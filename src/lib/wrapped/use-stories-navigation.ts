"use client";

import { useCallback, useRef } from "react";

const TAP_MAX_MS = 780;
const TAP_MAX_MOVE_PX = 18;
const SWIPE_THRESHOLD_PX = 40;
const HOLD_DELAY_MS = 200;
const SWIPE_MAX_VERTICAL_PX = 80;
const PREV_ZONE_RATIO = 0.33;

const IGNORE_SELECTOR =
  "button, a, input, textarea, select, label, [role='button'], [data-wrapped-nav-ignore]";

type PressState = {
  pointerId: number;
  localX: number;
  clientX: number;
  clientY: number;
  startedAt: number;
  width: number;
  moved: boolean;
};

type StoriesNavigationHandlers = {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: (event: React.PointerEvent) => void;
};

function shouldIgnoreTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(IGNORE_SELECTOR));
}

export function useStoriesNavigation({
  onNext,
  onPrev,
  onHoldStart,
  onHoldEnd,
  enabled = true,
}: {
  onNext: () => void;
  onPrev: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  enabled?: boolean;
}): StoriesNavigationHandlers {
  const pressRef = useRef<PressState | null>(null);
  const holdingRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current == null) return;
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  }, []);

  const endHold = useCallback(() => {
    clearHoldTimer();
    if (!holdingRef.current) return;
    holdingRef.current = false;
    onHoldEnd();
  }, [clearHoldTimer, onHoldEnd]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled || event.button !== 0) return;
      if (shouldIgnoreTarget(event.target)) return;

      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      pressRef.current = {
        pointerId: event.pointerId,
        localX: event.clientX - rect.left,
        clientX: event.clientX,
        clientY: event.clientY,
        startedAt: Date.now(),
        width: rect.width,
        moved: false,
      };
      holdingRef.current = false;
      clearHoldTimer();
      holdTimerRef.current = window.setTimeout(() => {
        holdTimerRef.current = null;
        if (!pressRef.current) return;
        holdingRef.current = true;
        onHoldStart();
      }, HOLD_DELAY_MS);

      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    },
    [enabled, onHoldStart, clearHoldTimer],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const press = pressRef.current;
    if (!press || press.pointerId !== event.pointerId) return;

    const dx = event.clientX - press.clientX;
    const dy = event.clientY - press.clientY;
    if (Math.hypot(dx, dy) > TAP_MAX_MOVE_PX) {
      press.moved = true;
    }
  }, []);

  const finishPress = useCallback(
    (event: React.PointerEvent, cancelled: boolean) => {
      const press = pressRef.current;
      if (!press || press.pointerId !== event.pointerId) return;

      const dx = event.clientX - press.clientX;
      const dy = event.clientY - press.clientY;
      const dt = Date.now() - press.startedAt;

      pressRef.current = null;
      endHold();

      try {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }

      if (cancelled) return;

      if (
        Math.abs(dx) >= SWIPE_THRESHOLD_PX &&
        Math.abs(dy) <= SWIPE_MAX_VERTICAL_PX
      ) {
        if (dx < 0) onNext();
        else onPrev();
        return;
      }

      const isTap =
        dt <= TAP_MAX_MS &&
        !press.moved &&
        Math.hypot(dx, dy) <= TAP_MAX_MOVE_PX;

      if (!isTap) return;

      const ratio = press.width > 0 ? press.localX / press.width : 0.5;
      if (ratio < PREV_ZONE_RATIO) onPrev();
      else onNext();
    },
    [endHold, onNext, onPrev],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      finishPress(event, false);
    },
    [finishPress],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent) => {
      finishPress(event, true);
    },
    [finishPress],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
