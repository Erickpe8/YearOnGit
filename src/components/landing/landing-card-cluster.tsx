"use client";

import { motion } from "framer-motion";
import { createContext, useContext, useEffect, useState } from "react";
import { IconChart, IconCode } from "@/components/ui/icons";
import { interpolate } from "@/lib/i18n/interpolate";
import {
  darkenHex,
  generateLandingPreviewStats,
  type LandingPreviewStats,
} from "@/lib/wrapped/landing-preview-stats";
import { useApp } from "@/providers/app-provider";
import { CodeParticles } from "./code-particles";

const HEATMAP = [
  1, 2, 3, 2, 1, 3, 3,
  2, 3, 3, 1, 2, 3, 2,
  1, 2, 1, 3, 3, 2, 1,
  3, 1, 2, 2, 3, 1, 2,
];

const HEATMAP_COLORS = [
  "bg-[#0e4429]",
  "bg-[#006d32]",
  "bg-[#26a641]",
  "bg-[#39d353]",
];

const LandingPreviewContext = createContext<LandingPreviewStats | null>(null);

function useLandingPreviewStats() {
  return useContext(LandingPreviewContext);
}

function IconFlame({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1.5-3.5C8 7 8 4 12 2c0 3 2 4.5 2 7a2.5 2.5 0 0 0 5 0c0 5-4 9-8 9s-8-4-8-9a6 6 0 0 1 6-6" />
    </svg>
  );
}

export function StreakWatermarkCard() {
  const { t } = useApp();
  const stats = useLandingPreviewStats();
  if (!stats) return null;

  return (
    <div className="pointer-events-none absolute top-[38%] left-1/2 z-10 w-[188px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/8 bg-white/[0.03] p-4 opacity-40 blur-[6px] max-[390px]:top-[36%] max-[390px]:w-[156px] max-[390px]:p-3">
      <div className="flex flex-col items-center">
        <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#39d353]/15 text-[#39d353]">
          <IconFlame className="h-3.5 w-3.5" />
        </div>
        <p className="stat-number-gradient font-display text-2xl font-extrabold max-[390px]:text-xl">
          {stats.streak}
        </p>
        <p className="i18n-micro mb-2 text-center text-[9px] font-semibold uppercase leading-snug text-on-surface-variant">
          {interpolate(t("previewStreak"), { count: stats.streak })}
        </p>
        <div className="flex h-11 w-full items-end justify-center gap-1.5 rounded-md bg-black/40 px-2 py-1.5">
          {stats.streakBars.map((value, i) => (
            <div
              key={i}
              className="w-2 rounded-t-sm bg-gradient-to-t from-[#238636] to-[#39d353] max-[390px]:w-1.5"
              style={{ height: Math.round((value / stats.streak) * 32) + 6 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommitsDecorCard() {
  const { t } = useApp();
  const stats = useLandingPreviewStats();
  if (!stats) return null;

  const topLanguage = stats.languages[0]?.name.slice(0, 2).toUpperCase() ?? "TS";
  const accentDark = darkenHex(stats.commitsAccent);

  return (
    <div
      className="glass-card glass-card-behind pointer-events-none absolute top-0 right-full z-20 mr-[30px] w-[118px] -translate-y-[32%] rounded-xl p-2.5 max-[390px]:right-auto max-[390px]:left-[-14px] max-[390px]:mr-0 max-[390px]:w-[100px] max-[390px]:p-2 md:mr-[34px] md:w-[122px]"
      style={{ rotate: "-7deg" }}
      aria-hidden
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: stats.commitsAccent }}
        >
          <IconCode className="h-2.5 w-2.5 text-white" />
        </div>
        <span
          className="rounded-full px-1.5 py-0.5 font-display text-[8px] font-bold"
          style={{
            backgroundColor: `${stats.commitsAccent}26`,
            color: stats.commitsAccent,
          }}
        >
          {topLanguage}
        </span>
      </div>
      <div className="mb-1 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full w-3/4 rounded-full"
          style={{ backgroundColor: stats.commitsAccent }}
        />
      </div>
      <p
        className="font-display text-2xl font-extrabold leading-none max-[390px]:text-xl"
        style={{
          backgroundImage: `linear-gradient(180deg, ${stats.commitsAccent} 0%, ${accentDark} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        {stats.commits}
      </p>
      <p className="i18n-micro mt-0.5 text-[8px] leading-snug text-on-surface-variant">
        {t("commitsThisYear")}
      </p>
    </div>
  );
}

export function ReposDecorCard() {
  const { t } = useApp();
  const stats = useLandingPreviewStats();
  if (!stats) return null;

  return (
    <div
      className="glass-card glass-card-behind pointer-events-none absolute top-0 left-full z-20 ml-[30px] w-[118px] -translate-y-[36%] rounded-xl p-2.5 max-[390px]:left-auto max-[390px]:right-[-14px] max-[390px]:ml-0 max-[390px]:w-[100px] max-[390px]:p-2 md:ml-[34px] md:w-[122px]"
      style={{ rotate: "6deg" }}
      aria-hidden
    >
      <div className="mb-1.5 flex gap-1">
        <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
      </div>
      <p className="mb-1 font-display text-[9px] text-[#a2c9ff]">main.rs</p>
      <div className="flex items-end justify-between">
        <span className="stat-number-gradient font-display text-2xl font-extrabold max-[390px]:text-xl">
          {stats.repos}
        </span>
        <span className="i18n-micro text-[8px] leading-snug text-on-surface-variant">
          {t("topRepos")}
        </span>
      </div>
    </div>
  );
}

export function HeatmapCard() {
  const { t } = useApp();
  const stats = useLandingPreviewStats();
  if (!stats) return null;

  return (
    <div
      className="glass-card glass-card-front pointer-events-none absolute right-full bottom-[-6px] z-30 mr-[34px] w-[300px] rounded-2xl p-4 max-[390px]:right-auto max-[390px]:bottom-[-8px] max-[390px]:left-[-28px] max-[390px]:mr-0 max-[390px]:w-[190px] max-[390px]:p-3 md:mr-[38px]"
      style={{ rotate: "-4deg" }}
      aria-hidden
    >
      <div className="mb-3 flex items-start justify-between gap-1">
        <div className="text-left">
          <h3 className="i18n-text font-display text-sm font-bold text-[#39d353] max-[390px]:text-xs">
            {t("globalImpact")}
          </h3>
          <p className="i18n-micro text-[10px] leading-snug text-on-surface-variant max-[390px]:text-[9px]">
            {interpolate(t("contributions2026"), { count: stats.contributions })}
          </p>
        </div>
        <IconChart className="h-4 w-4 shrink-0 text-[#39d353]/40" />
      </div>
      <div className="grid grid-cols-7 gap-1 max-[390px]:gap-0.5">
        {HEATMAP.map((level, i) => (
          <div
            key={i}
            className={`aspect-square w-full rounded-sm ${HEATMAP_COLORS[level]}`}
          />
        ))}
      </div>
    </div>
  );
}

export function LanguagesCard() {
  const { t } = useApp();
  const stats = useLandingPreviewStats();
  if (!stats) return null;

  return (
    <div
      className="glass-card glass-card-front pointer-events-none absolute bottom-[-6px] left-full z-30 ml-[34px] w-[300px] rounded-2xl p-4 max-[390px]:left-auto max-[390px]:right-[-28px] max-[390px]:bottom-[-8px] max-[390px]:ml-0 max-[390px]:w-[190px] max-[390px]:p-3 md:ml-[38px]"
      style={{ rotate: "4deg" }}
      aria-hidden
    >
      <h3 className="mb-3 text-left font-display text-sm font-bold max-[390px]:mb-2 max-[390px]:text-xs">
        {t("languages")}
      </h3>
      <div className="space-y-3 max-[390px]:space-y-2">
        {stats.languages.map((lang) => (
          <div key={lang.name}>
            <div className="mb-1 flex justify-between text-xs max-[390px]:text-[10px]">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: lang.color }}
                />
                {lang.name}
              </span>
              <span
                className="font-display text-sm font-bold"
                style={{ color: lang.color }}
              >
                {lang.pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${lang.pct}%`, backgroundColor: lang.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type LandingCardClusterProps = {
  children: React.ReactNode;
};

export function LandingCardCluster({ children }: LandingCardClusterProps) {
  const [stats, setStats] = useState<LandingPreviewStats | null>(null);

  useEffect(() => {
    setStats(generateLandingPreviewStats());
  }, []);

  return (
    <LandingPreviewContext.Provider value={stats}>
      <section className="flex w-full flex-1 items-center justify-center overflow-visible px-4 pt-10 pb-6 max-[390px]:px-3 max-[390px]:pt-8 max-[390px]:pb-5 md:pt-14 md:pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="relative isolate mx-auto w-full max-w-[520px] max-[390px]:max-w-[340px]"
        >
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(57,211,83,0.18)_0%,rgba(57,211,83,0.06)_40%,transparent_70%)] blur-[2px] max-[390px]:h-[400px] max-[390px]:w-[400px]"
            aria-hidden
          />
          <CodeParticles />
          <StreakWatermarkCard />
          <div className="relative z-40 px-1 text-center">{children}</div>
        </motion.div>
      </section>
    </LandingPreviewContext.Provider>
  );
}
