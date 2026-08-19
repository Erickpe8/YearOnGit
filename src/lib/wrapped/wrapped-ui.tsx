"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_WRAPPED_CONFIG,
  type WrappedAdminConfig,
  type WrappedFeatures,
  type WrappedStatsToggles,
} from "@/lib/admin/wrapped-config";

export type WrappedUiValue = {
  features: WrappedFeatures;
  stats: WrappedStatsToggles;
  preview: boolean;
  includeDisabledSlides: boolean;
  year: number;
};

const DEFAULT_UI: WrappedUiValue = {
  features: DEFAULT_WRAPPED_CONFIG.features,
  stats: DEFAULT_WRAPPED_CONFIG.stats,
  preview: false,
  includeDisabledSlides: false,
  year: DEFAULT_WRAPPED_CONFIG.wrappedYear,
};

const WrappedUiContext = createContext<WrappedUiValue>(DEFAULT_UI);

export function WrappedUiProvider({
  config,
  preview = false,
  includeDisabledSlides = false,
  children,
}: {
  config: WrappedAdminConfig;
  preview?: boolean;
  includeDisabledSlides?: boolean;
  children: ReactNode;
}) {
  return (
    <WrappedUiContext.Provider
      value={{
        features: config.features,
        stats: config.stats,
        preview,
        includeDisabledSlides,
        year: config.wrappedYear,
      }}
    >
      {children}
    </WrappedUiContext.Provider>
  );
}

export function useWrappedUi(): WrappedUiValue {
  return useContext(WrappedUiContext);
}
