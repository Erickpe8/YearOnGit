"use client";

import { IconCode } from "@/components/ui/icons";
import { useApp } from "@/providers/app-provider";

export function LandingFloatingCards() {
  const { t } = useApp();

  return (
    <>
      <div className="glass-card animate-float-left absolute bottom-20 left-8 hidden h-72 w-56 rounded-xl p-5 lg:block xl:left-20">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container">
            <IconCode className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-sm font-medium text-primary">TS</span>
        </div>
        <div className="space-y-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant">
            <div className="h-full w-3/4 bg-primary" />
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant">
            <div className="h-full w-1/2 bg-secondary" />
          </div>
          <div className="mt-6 font-display text-5xl font-extrabold text-on-surface">
            847
          </div>
          <div className="text-sm text-on-surface-variant">
            {t("commitsThisYear")}
          </div>
        </div>
      </div>

      <div className="glass-card animate-float-right absolute top-32 right-8 hidden h-44 w-64 rounded-xl p-5 lg:block xl:right-20">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>
        <div className="mb-2 font-display text-sm text-secondary">main.rs</div>
        <div className="space-y-1.5 opacity-40">
          <div className="h-1 w-full rounded bg-surface-variant" />
          <div className="h-1 w-3/4 rounded bg-surface-variant" />
        </div>
        <div className="mt-4 flex items-end justify-between">
          <span className="font-display text-5xl font-extrabold text-primary">
            12
          </span>
          <span className="text-sm text-on-surface-variant">{t("topRepos")}</span>
        </div>
      </div>
    </>
  );
}
