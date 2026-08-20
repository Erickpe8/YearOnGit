"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_DENIED_CONSENT,
  readStoredConsent,
  writeStoredConsent,
  type ConsentPreferences,
} from "@/lib/consent/cookies";

type ConsentContextValue = {
  ready: boolean;
  consent: ConsentPreferences;
  decided: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  saveCustom: (next: {
    analytics: boolean;
    preferences: boolean;
  }) => void;
  openPreferences: () => void;
  preferencesOpen: boolean;
  closePreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentPreferences>(DEFAULT_DENIED_CONSENT);
  const [decided, setDecided] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setConsent(stored);
      setDecided(true);
    }
    setReady(true);
  }, []);

  const persist = useCallback(
    (next: { analytics: boolean; preferences: boolean }) => {
      const saved = writeStoredConsent(next);
      setConsent(saved);
      setDecided(true);
      setPreferencesOpen(false);
    },
    [],
  );

  const acceptAll = useCallback(() => {
    persist({ analytics: true, preferences: true });
  }, [persist]);

  const rejectNonEssential = useCallback(() => {
    persist({ analytics: false, preferences: false });
  }, [persist]);

  const saveCustom = useCallback(
    (next: { analytics: boolean; preferences: boolean }) => {
      persist(next);
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      ready,
      consent,
      decided,
      acceptAll,
      rejectNonEssential,
      saveCustom,
      openPreferences: () => setPreferencesOpen(true),
      preferencesOpen,
      closePreferences: () => setPreferencesOpen(false),
    }),
    [
      ready,
      consent,
      decided,
      acceptAll,
      rejectNonEssential,
      saveCustom,
      preferencesOpen,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return ctx;
}
