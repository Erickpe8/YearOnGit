"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";
import {
  IconBuilding,
  IconCalendar,
  IconGitFork,
  IconStar,
  IconUser,
  IconUserPlus,
  IconUsers,
} from "@/components/ui/icons";
import type { Locale } from "@/lib/i18n/supported-locales";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { WrappedStats } from "@/lib/wrapped/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

type CommunitySlideProps = {
  stats: WrappedStats;
  locale: Locale;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DURATION = 0.35;
const STAGGER = 0.09;

const ACCENT = {
  network: "#39d353",
  stars: "#f5c518",
  forks: "#a2c9ff",
} as const;

const T = {
  title: 0.04,
  yearsBadge: 0.12,
  networkLabel: 0.2,
  networkCard0: 0.26,
  reachLabel: 0.26 + 2 * STAGGER + 0.16,
  reachCard0: 0.26 + 2 * STAGGER + 0.22,
  featured: 0.26 + 2 * STAGGER + 0.22 + STAGGER + 0.14,
  org: 0.26 + 2 * STAGGER + 0.22 + STAGGER + 0.28,
} as const;

function SectionLabel({
  children,
  delay,
  reducedMotion,
}: {
  children: ReactNode;
  delay: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.p
      className="i18n-text shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant md:text-xs"
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion ? { duration: 0 } : { duration: DURATION, delay, ease: EASE }
      }
    >
      {children}
    </motion.p>
  );
}

function StatCard({
  value,
  label,
  icon,
  delay,
  reducedMotion,
  locale,
  accent,
}: {
  value: number;
  label: string;
  icon: ReactNode;
  delay: number;
  reducedMotion: boolean;
  locale: Locale;
  accent: string;
}) {
  return (
    <motion.div
      className="glass-card flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center md:py-3"
      style={
        {
          borderColor: `color-mix(in srgb, ${accent} 22%, transparent)`,
        } as CSSProperties
      }
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion ? { duration: 0 } : { duration: DURATION, delay, ease: EASE }
      }
    >
      <span style={{ color: accent }} className="opacity-85">
        {icon}
      </span>
      <p
        className="font-display text-lg font-bold leading-none md:text-2xl"
        style={{ color: accent }}
      >
        <AnimatedCounter value={value} locale={locale} durationMs={900} />
      </p>
      <p className="i18n-text text-[10px] leading-tight text-on-surface-variant md:text-xs">
        {label}
      </p>
    </motion.div>
  );
}

function repoShortName(nameWithOwner: string): string {
  const parts = nameWithOwner.split("/");
  return parts[parts.length - 1] || nameWithOwner;
}

export function CommunitySlide({ stats, locale, t }: CommunitySlideProps) {
  const reducedMotion = usePrefersReducedMotion();
  const mostStarred = stats.popularity.mostStarredRepository;
  const orgCount = stats.profile.organizationsCount;
  const mostActiveOrg = stats.profile.mostActiveOrganization;

  const fadeUp = (delay: number, extra?: { scale?: number }) =>
    reducedMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0 } }
      : {
          initial: {
            opacity: 0,
            y: 12,
            ...(extra?.scale != null ? { scale: extra.scale } : {}),
          },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: DURATION, delay, ease: EASE },
        };

  const titleMotion = fadeUp(T.title);
  const yearsMotion = fadeUp(T.yearsBadge);
  const featuredMotion = fadeUp(T.featured, { scale: 0.95 });
  const orgMotion = fadeUp(T.org);

  return (
    <WrappedSlideShell
      slideKey="community"
      centered={false}
      className="community-slide"
    >
      <div className="flex w-full max-w-md shrink-0 flex-col items-center gap-1.5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <motion.h2
            className="i18n-text wrapped-slide-title font-display font-bold"
            initial={titleMotion.initial}
            animate={titleMotion.animate}
            transition={titleMotion.transition}
          >
            {t("yourCommunity")}
          </motion.h2>
          {stats.profile.yearsOnGit > 0 ? (
            <motion.span
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-display text-[10px] font-semibold text-on-surface-variant md:text-xs"
              initial={yearsMotion.initial}
              animate={yearsMotion.animate}
              transition={yearsMotion.transition}
            >
              <IconCalendar
                className="h-3 w-3"
                style={{ color: ACCENT.network }}
              />
              {t("yearsOnGit", { count: stats.profile.yearsOnGit })}
            </motion.span>
          ) : null}
        </div>
      </div>

      <div className="flex w-full max-w-md shrink-0 flex-col gap-2">
        <SectionLabel delay={T.networkLabel} reducedMotion={reducedMotion}>
          {t("communityNetworkTitle")}
        </SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            value={stats.social.followers}
            label={t("followersLabel")}
            icon={<IconUser className="h-3.5 w-3.5" />}
            delay={T.networkCard0}
            reducedMotion={reducedMotion}
            locale={locale}
            accent={ACCENT.network}
          />
          <StatCard
            value={stats.social.following}
            label={t("followingLabel")}
            icon={<IconUserPlus className="h-3.5 w-3.5" />}
            delay={T.networkCard0 + STAGGER}
            reducedMotion={reducedMotion}
            locale={locale}
            accent={ACCENT.network}
          />
          <StatCard
            value={stats.social.friends}
            label={t("friendsLabel")}
            icon={<IconUsers className="h-3.5 w-3.5" />}
            delay={T.networkCard0 + 2 * STAGGER}
            reducedMotion={reducedMotion}
            locale={locale}
            accent={ACCENT.network}
          />
        </div>
      </div>

      <div className="flex w-full max-w-md shrink-0 flex-col gap-2">
        <SectionLabel delay={T.reachLabel} reducedMotion={reducedMotion}>
          {t("popularityTitle")}
        </SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            value={stats.popularity.totalStars}
            label={t("totalStarsLabel")}
            icon={<IconStar className="h-3.5 w-3.5" />}
            delay={T.reachCard0}
            reducedMotion={reducedMotion}
            locale={locale}
            accent={ACCENT.stars}
          />
          <StatCard
            value={stats.popularity.totalForks}
            label={t("totalForksLabel")}
            icon={<IconGitFork className="h-3.5 w-3.5" />}
            delay={T.reachCard0 + STAGGER}
            reducedMotion={reducedMotion}
            locale={locale}
            accent={ACCENT.forks}
          />
        </div>

        {mostStarred ? (
          <motion.div
            className="glass-card relative flex items-start gap-3 overflow-hidden rounded-xl px-3 py-3"
            style={{
              borderColor: `color-mix(in srgb, ${ACCENT.stars} 35%, transparent)`,
              boxShadow: `0 0 24px color-mix(in srgb, ${ACCENT.stars} 10%, transparent)`,
            }}
            initial={featuredMotion.initial}
            animate={featuredMotion.animate}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.42, delay: T.featured, ease: EASE }
            }
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${ACCENT.stars}66, transparent)`,
              }}
            />
            <span
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                color: ACCENT.stars,
                background: `color-mix(in srgb, ${ACCENT.stars} 12%, transparent)`,
              }}
            >
              <IconStar className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p
                className="i18n-text text-[10px] font-semibold uppercase tracking-[0.12em] md:text-xs"
                style={{ color: ACCENT.stars }}
              >
                {t("mostStarredBadge")}
              </p>
              <p
                className="truncate font-display text-sm font-bold text-on-surface md:text-base"
                title={mostStarred.nameWithOwner}
              >
                {repoShortName(mostStarred.nameWithOwner)}
              </p>
              <p className="truncate text-[10px] text-on-surface-variant md:text-xs">
                {mostStarred.nameWithOwner}
              </p>
            </div>
            {mostStarred.value > 0 ? (
              <p
                className="shrink-0 font-display text-lg font-extrabold md:text-xl"
                style={{ color: ACCENT.stars }}
              >
                <AnimatedCounter
                  value={mostStarred.value}
                  locale={locale}
                  durationMs={1000}
                />
              </p>
            ) : null}
          </motion.div>
        ) : null}

        {orgCount > 0 ? (
          <motion.div
            className="glass-card flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            initial={orgMotion.initial}
            animate={orgMotion.animate}
            transition={orgMotion.transition}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-on-surface-variant">
              <IconBuilding className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="i18n-text text-[11px] text-on-surface md:text-sm">
                <span className="font-display font-bold text-on-surface">
                  <AnimatedCounter
                    value={orgCount}
                    locale={locale}
                    durationMs={800}
                  />
                </span>{" "}
                {t("organizationsLabel").toLowerCase()}
                {mostActiveOrg ? (
                  <>
                    <span className="text-on-surface-variant/50"> · </span>
                    <span className="text-on-surface-variant">
                      {t("mostActiveOrgShort")}:{" "}
                    </span>
                    <span className="font-medium text-on-surface">
                      {mostActiveOrg}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
    </WrappedSlideShell>
  );
}
