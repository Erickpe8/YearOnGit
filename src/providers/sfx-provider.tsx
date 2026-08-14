"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AUDIO_ENGINE_BUILD,
  createSfxEngine,
  type SfxId,
} from "@/lib/audio/sfx-engine";
import {
  IDLE_SCENE,
  LOADING_SCENE,
  type MusicCue,
  type MusicScene,
} from "@/lib/audio/score";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

type SfxContextValue = {
  muted: boolean;
  toggleMuted: () => void;
  play: (id: SfxId) => void;
  unlock: () => void;
  startBeat: () => void;
  stopBeat: () => void;
  setScene: (scene: MusicScene) => void;
  cue: (id: MusicCue) => void;
};

const SfxContext = createContext<SfxContextValue | null>(null);
const MUTE_KEY = "yearongit-sfx-muted";

let liveEngine: ReturnType<typeof createSfxEngine> | null = null;
let liveBuild = "";

function getLiveEngine() {
  if (!liveEngine || liveBuild !== AUDIO_ENGINE_BUILD) {
    liveEngine?.dispose();
    liveEngine = createSfxEngine();
    liveBuild = AUDIO_ENGINE_BUILD;
  }
  return liveEngine;
}

export function SfxProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef(getLiveEngine());
  engineRef.current = getLiveEngine();

  const [muted, setMuted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const stored = localStorage.getItem(MUTE_KEY);
    if (stored === "true") {
      setMuted(true);
      engineRef.current?.setMuted(true);
    }
  }, []);

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  const unlock = useCallback(() => {
    void engineRef.current?.unlock();
  }, []);

  useEffect(() => {
    const onGesture = () => {
      unlock();
    };
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    window.addEventListener("touchstart", onGesture, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
  }, [unlock]);

  const play = useCallback((id: SfxId) => {
    engineRef.current?.play(id);
  }, []);

  const startBeat = useCallback(() => {
    engineRef.current?.startBeat();
  }, []);

  const stopBeat = useCallback(() => {
    engineRef.current?.stopBeat();
  }, []);

  const setScene = useCallback((scene: MusicScene) => {
    engineRef.current?.setScene(scene);
  }, []);

  const cue = useCallback((id: MusicCue) => {
    engineRef.current?.cue(id);
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, String(next));
      engineRef.current?.setMuted(next);
      void engineRef.current?.unlock();
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ muted, toggleMuted, play, unlock, startBeat, stopBeat, setScene, cue }),
    [muted, toggleMuted, play, unlock, startBeat, stopBeat, setScene, cue],
  );

  return <SfxContext.Provider value={value}>{children}</SfxContext.Provider>;
}

export function useSfx() {
  const context = useContext(SfxContext);
  if (!context) {
    throw new Error("useSfx must be used within SfxProvider");
  }
  return context;
}

export function useWrappedBeat(enabled = true, scene: MusicScene = LOADING_SCENE) {
  const { startBeat, stopBeat, unlock, setScene } = useSfx();

  useEffect(() => {
    if (!enabled) {
      stopBeat();
      setScene(IDLE_SCENE);
      return;
    }
    unlock();
    setScene(scene);
    startBeat();
    return () => stopBeat();
  }, [enabled, scene, startBeat, stopBeat, unlock, setScene]);
}
