"use client";

import type { ReactNode } from "react";
import type { TranslationKey } from "@/lib/i18n/translations";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import type { WrappedStats } from "@/lib/wrapped/types";

type TranslationValues = Record<string, string | number>;

type YearOverviewPanelProps = {
  stats: WrappedStats;
  locale: string;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  compact?: boolean;
};

function StatRow({
  label,
  children,
  compact,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`wrapped-stat-row ${compact ? "wrapped-stat-row--compact" : ""}`}
    >
      <span className="wrapped-stat-label">{label}</span>
      <span className="wrapped-stat-value">{children}</span>
    </div>
  );
}

export function YearOverviewPanel({
  stats,
  locale,
  t,
  compact = false,
}: YearOverviewPanelProps) {
  return (
    <div
      className={`glass-card wrapped-overview-panel w-full max-w-md rounded-2xl text-left ${
        compact ? "p-3 md:p-4" : "p-4 md:p-6"
      }`}
    >
      <div className="wrapped-stat-list">
        <StatRow label={t("totalContributions")} compact={compact}>
          <AnimatedCounter
            value={stats.totalContributions}
            locale={locale}
            durationMs={850}
          />
        </StatRow>
        <StatRow label={t("totalCommits")} compact={compact}>
          <AnimatedCounter
            value={stats.totalCommits}
            locale={locale}
            durationMs={900}
          />
        </StatRow>
        <StatRow label={t("totalPullRequests")} compact={compact}>
          <AnimatedCounter
            value={stats.totalPullRequests}
            locale={locale}
            durationMs={950}
          />
        </StatRow>
        <StatRow label={t("totalIssues")} compact={compact}>
          <AnimatedCounter
            value={stats.totalIssues}
            locale={locale}
            durationMs={1000}
          />
        </StatRow>
        <StatRow label={t("totalCodeReviews")} compact={compact}>
          <AnimatedCounter
            value={stats.totalCodeReviews}
            locale={locale}
            durationMs={1050}
          />
        </StatRow>
        <StatRow label={t("activeRepositories")} compact={compact}>
          <AnimatedCounter
            value={stats.activeRepositories}
            locale={locale}
            durationMs={1100}
          />
        </StatRow>
        <StatRow label={t("languagesLabel")} compact={compact}>
          <AnimatedCounter
            value={stats.languageCount}
            locale={locale}
            durationMs={1150}
          />
        </StatRow>
        <StatRow label={t("longestStreak")} compact={compact}>
          <span className="inline-flex items-baseline gap-1">
            <AnimatedCounter
              value={stats.longestStreak}
              locale={locale}
              durationMs={1200}
            />
            <span className="wrapped-stat-unit">{t("days")}</span>
          </span>
        </StatRow>
      </div>
    </div>
  );
}
