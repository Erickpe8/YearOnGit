"use client";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendarEvent,
  IconFlame,
  IconFolderPlus,
  IconGitCommit,
  IconHeartHandshake,
  IconLanguage,
  IconLock,
  IconStar,
  IconUsers,
} from "@/components/ui/icons";
import { WrappedSlideShell } from "@/components/wrapped/wrapped-slide-shell";
import {
  ACHIEVEMENT_CATALOG,
  PODIUM_COLORS,
  TIER_ORDER,
  getAchievementDefinition,
  resolveAchievementTier,
  resolveNextTier,
  tierRank,
  tierThreshold,
  type AchievementIconName,
} from "@/lib/wrapped/achievements-catalog";
import {
  ACHIEVEMENT_DESC_KEYS,
  ACHIEVEMENT_TITLE_KEYS,
  ACHIEVEMENT_UNLOCK_KEYS,
} from "@/lib/wrapped/format-highlight";
import { formatNumber } from "@/lib/wrapped/format";
import type { Locale } from "@/lib/i18n/supported-locales";
import type { TranslationKey } from "@/lib/i18n/translations";
import type {
  Achievement,
  AchievementId,
  AchievementTier,
} from "@/lib/wrapped/modules/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";
import { useSfx } from "@/providers/sfx-provider";

type AchievementsSlideProps = {
  achievements: Achievement[];
  locale: Locale;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ACHIEVEMENT_INTRO_MS = 400;
export const ACHIEVEMENT_CARD_MS = 1_400;

export function achievementsCarouselSettleMs(
  count: number,
  reducedMotion: boolean,
): number {
  const n = Math.max(1, count);
  if (reducedMotion) {
    return 300 + n * 500;
  }
  return ACHIEVEMENT_INTRO_MS + n * ACHIEVEMENT_CARD_MS;
}

const ICON_MAP: Record<
  AchievementIconName,
  (props: { className?: string }) => ReactNode
> = {
  "git-commit": (p) => <IconGitCommit {...p} />,
  flame: (p) => <IconFlame {...p} />,
  language: (p) => <IconLanguage {...p} />,
  "heart-handshake": (p) => <IconHeartHandshake {...p} />,
  "folder-plus": (p) => <IconFolderPlus {...p} />,
  users: (p) => <IconUsers {...p} />,
  "calendar-event": (p) => <IconCalendarEvent {...p} />,
  star: (p) => <IconStar {...p} />,
};

const TIER_LABEL_KEYS = {
  bronze: "achievementTierBronze",
  silver: "achievementTierSilver",
  gold: "achievementTierGold",
} as const satisfies Record<AchievementTier, TranslationKey>;

function AchievementBadge({
  icon,
  unlocked,
  tier,
}: {
  icon: AchievementIconName;
  unlocked: boolean;
  tier: AchievementTier | null;
}) {
  const Icon = ICON_MAP[icon];
  const accent = unlocked && tier ? PODIUM_COLORS[tier] : undefined;

  return (
    <div
      className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full md:h-[4.5rem] md:w-[4.5rem]"
      style={
        unlocked && accent
          ? {
              color: accent,
              background: `color-mix(in srgb, ${accent} 16%, transparent)`,
              boxShadow: `0 0 24px color-mix(in srgb, ${accent} 20%, transparent)`,
            }
          : undefined
      }
    >
      {!unlocked ? (
        <span className="absolute inset-0 rounded-full bg-white/5 text-on-surface-variant/45" />
      ) : null}
      <span
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: accent
            ? `color-mix(in srgb, ${accent} 45%, transparent)`
            : "rgba(255,255,255,0.1)",
        }}
      />
      <span
        className={`relative z-[1] [&_svg]:h-7 [&_svg]:w-7 md:[&_svg]:h-8 md:[&_svg]:w-8 ${
          unlocked ? "" : "text-on-surface-variant/45"
        }`}
        style={accent ? { color: accent } : undefined}
      >
        {Icon({ className: "h-7 w-7" })}
      </span>
      {!unlocked ? (
        <span className="absolute -bottom-0.5 -right-0.5 z-[2] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-surface-container text-on-surface-variant">
          <IconLock className="h-3 w-3" />
        </span>
      ) : null}
    </div>
  );
}

function TierPodium({
  tiers,
  thresholds,
  locale,
}: {
  tiers?: Achievement["tiers"] | null;
  thresholds: { bronze: number; silver: number; gold: number };
  locale: Locale;
}) {
  const safeTiers = tiers ?? { bronze: false, silver: false, gold: false };
  return (
    <div className="flex w-full items-end justify-center gap-1.5 pt-1">
      {TIER_ORDER.map((tier) => {
        const unlocked = safeTiers[tier];
        const color = PODIUM_COLORS[tier];
        const height =
          tier === "bronze" ? "h-5" : tier === "silver" ? "h-7" : "h-9";
        return (
          <div
            key={tier}
            className="flex w-12 flex-col items-center gap-0.5"
            title={`${tier}: ${thresholds[tier]}`}
          >
            <span
              className={`text-[9px] font-semibold uppercase tracking-wide ${
                unlocked ? "" : "text-on-surface-variant/40"
              }`}
              style={unlocked ? { color } : undefined}
            >
              {formatNumber(thresholds[tier], locale)}
            </span>
            <div
              className={`w-full rounded-t-md ${height} ${
                unlocked ? "" : "bg-white/8 opacity-40"
              }`}
              style={
                unlocked
                  ? {
                      background: `linear-gradient(180deg, color-mix(in srgb, ${color} 75%, white), color-mix(in srgb, ${color} 45%, transparent))`,
                      boxShadow: `0 0 10px color-mix(in srgb, ${color} 25%, transparent)`,
                    }
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function emptyAchievement(id: AchievementId): Achievement {
  const def = getAchievementDefinition(id);
  return {
    id,
    unlocked: false,
    tier: null,
    nextTier: "bronze",
    threshold: def?.tiers.bronze ?? 0,
    value: 0,
    tiers: { bronze: false, silver: false, gold: false },
  };
}

function normalizeAchievement(raw: Achievement): Achievement {
  const def = getAchievementDefinition(raw.id);
  const value = typeof raw.value === "number" ? raw.value : 0;

  if (!def) {
    return {
      ...emptyAchievement(raw.id),
      value,
      unlocked: Boolean(raw.unlocked),
      tier: raw.tier ?? null,
      nextTier: raw.nextTier ?? "bronze",
      threshold: raw.threshold ?? 0,
      tiers: raw.tiers ?? { bronze: false, silver: false, gold: false },
    };
  }

  if (raw.tiers && "bronze" in raw.tiers) {
    return {
      id: raw.id,
      value,
      unlocked: Boolean(raw.unlocked),
      tier: raw.tier ?? null,
      nextTier: raw.nextTier ?? (raw.unlocked ? null : "bronze"),
      threshold: raw.threshold ?? def.tiers.bronze,
      tiers: raw.tiers,
    };
  }

  const tier = resolveAchievementTier(value, def.tiers);
  const nextTier = resolveNextTier(tier);
  const threshold = nextTier
    ? tierThreshold(def.tiers, nextTier)
    : def.tiers.gold;

  return {
    id: raw.id,
    value,
    unlocked: tier !== null,
    tier,
    nextTier,
    threshold,
    tiers: {
      bronze: value >= def.tiers.bronze,
      silver: value >= def.tiers.silver,
      gold: value >= def.tiers.gold,
    },
  };
}

export function AchievementsSlide({
  achievements,
  locale,
  t,
}: AchievementsSlideProps) {
  const reducedMotion = usePrefersReducedMotion();
  const { cue } = useSfx();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayPausedRef = useRef(false);

  const ordered = useMemo(() => {
    const byId = new Map(
      achievements.map((item) => [item.id, normalizeAchievement(item)]),
    );
    const merged = ACHIEVEMENT_CATALOG.map((entry) => {
      return (
        byId.get(entry.id as AchievementId) ??
        emptyAchievement(entry.id as AchievementId)
      );
    });
    return [...merged].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return tierRank(b.tier) - tierRank(a.tier);
    });
  }, [achievements]);

  const unlockedCount = ordered.filter((item) => item.unlocked).length;
  const total = ordered.length;

  const scrollToIndex = useCallback(
    (index: number, opts?: { userInitiated?: boolean }) => {
      if (opts?.userInitiated) {
        autoplayPausedRef.current = true;
      }
      const el = scrollerRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>("[data-achievement-card]");
      if (!card) return;
      const gap = 12;
      const next = Math.max(0, Math.min(ordered.length - 1, index));
      el.scrollTo({
        left: next * (card.offsetWidth + gap),
        behavior: reducedMotion ? "auto" : "smooth",
      });
      setActiveIndex(next);
    },
    [ordered.length, reducedMotion],
  );

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const card = el.querySelector<HTMLElement>("[data-achievement-card]");
    const cardWidth = card?.offsetWidth ?? el.clientWidth;
    const gap = 12;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.max(0, Math.min(ordered.length - 1, index)));
  }, [ordered.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    syncActiveFromScroll();
    el.addEventListener("scroll", syncActiveFromScroll, { passive: true });
    window.addEventListener("resize", syncActiveFromScroll);
    return () => {
      el.removeEventListener("scroll", syncActiveFromScroll);
      window.removeEventListener("resize", syncActiveFromScroll);
    };
  }, [syncActiveFromScroll]);

  useEffect(() => {
    const item = ordered[activeIndex];
    if (!item?.unlocked) return;
    if (activeIndex === 0 || item.tier === "gold") cue("lift");
  }, [activeIndex, ordered, cue]);

  useEffect(() => {
    autoplayPausedRef.current = false;
    setActiveIndex(0);
    const el = scrollerRef.current;
    if (el) {
      el.scrollTo({ left: 0, behavior: "auto" });
    }

    if (ordered.length <= 1) return;

    const introMs = reducedMotion ? 300 : ACHIEVEMENT_INTRO_MS;
    const stepMs = reducedMotion ? 500 : ACHIEVEMENT_CARD_MS;
    const timers: number[] = [];

    for (let i = 1; i < ordered.length; i += 1) {
      const delay = introMs + i * stepMs;
      timers.push(
        window.setTimeout(() => {
          if (autoplayPausedRef.current) return;
          scrollToIndex(i);
        }, delay),
      );
    }

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [ordered.length, reducedMotion, scrollToIndex]);

  return (
    <WrappedSlideShell
      slideKey="achievements"
      centered={false}
      className="achievements-slide"
    >
      <div className="flex w-full max-w-3xl shrink-0 flex-col items-center gap-1">
        <h2 className="i18n-text wrapped-slide-title font-display font-bold">
          {t("achievementsTitle")}
        </h2>
        <p className="i18n-text text-center text-sm text-on-surface-variant md:text-base">
          {t("achievementsSubtitle", {
            unlocked: unlockedCount,
            total,
          })}
        </p>
      </div>

      <div className="relative flex min-h-0 w-full max-w-3xl flex-1 flex-col justify-center gap-3">
        <div className="relative">
          <button
            type="button"
            aria-label="Previous"
            className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-surface-container/90 text-on-surface backdrop-blur md:flex disabled:opacity-30"
            disabled={activeIndex <= 0}
            onClick={() =>
              scrollToIndex(activeIndex - 1, { userInitiated: true })
            }
          >
            <IconArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-surface-container/90 text-on-surface backdrop-blur md:flex disabled:opacity-30"
            disabled={activeIndex >= ordered.length - 1}
            onClick={() =>
              scrollToIndex(activeIndex + 1, { userInitiated: true })
            }
          >
            <IconArrowRight className="h-4 w-4" />
          </button>

          <div
            ref={scrollerRef}
            className="achievements-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden"
            onPointerDown={() => {
              autoplayPausedRef.current = true;
            }}
          >
            {ordered.map((achievement, index) => {
              const def = getAchievementDefinition(achievement.id);
              if (!def) return null;
              const unlocked = achievement.unlocked;
              const accent =
                unlocked && achievement.tier
                  ? PODIUM_COLORS[achievement.tier]
                  : undefined;
              const titleKey = ACHIEVEMENT_TITLE_KEYS[achievement.id];
              const descKey = ACHIEVEMENT_DESC_KEYS[achievement.id];
              const unlockKey = ACHIEVEMENT_UNLOCK_KEYS[achievement.id];
              const tierLabel = achievement.tier
                ? t(TIER_LABEL_KEYS[achievement.tier])
                : null;

              return (
                <motion.article
                  key={achievement.id}
                  data-achievement-card
                  className={`glass-card flex w-[min(100%,18.5rem)] shrink-0 snap-center flex-col items-center gap-2 rounded-2xl px-4 py-4 text-center md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-1.5rem*2)/3)] ${
                    unlocked ? "" : "opacity-55 grayscale"
                  }`}
                  style={
                    unlocked && accent
                      ? {
                          borderColor: `color-mix(in srgb, ${accent} 28%, transparent)`,
                        }
                      : undefined
                  }
                  initial={
                    reducedMotion
                      ? false
                      : unlocked
                        ? { opacity: 0, scale: 0.92, y: 12 }
                        : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : unlocked
                        ? {
                            delay: 0.08 + Math.min(index, 4) * 0.06,
                            type: "spring",
                            stiffness: 320,
                            damping: 22,
                          }
                        : {
                            duration: 0.3,
                            delay: 0.1 + Math.min(index, 6) * 0.04,
                            ease: EASE,
                          }
                  }
                >
                  <AchievementBadge
                    icon={def.icon}
                    unlocked={unlocked}
                    tier={achievement.tier}
                  />
                  {tierLabel ? (
                    <p
                      className="font-display text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: accent }}
                    >
                      {tierLabel}
                    </p>
                  ) : null}
                  <h3
                    className="i18n-text font-display text-base font-bold md:text-lg"
                    style={
                      unlocked && accent
                        ? { color: accent }
                        : { color: "var(--on-surface-variant)" }
                    }
                  >
                    {t(titleKey)}
                  </h3>
                  <p className="i18n-text line-clamp-2 text-[11px] leading-snug text-on-surface-variant md:text-xs">
                    {t(descKey)}
                  </p>

                  <TierPodium
                    tiers={achievement.tiers}
                    thresholds={def.tiers}
                    locale={locale}
                  />

                  {!unlocked ? (
                    <p className="i18n-text line-clamp-2 text-[10px] leading-snug text-on-surface-variant/80 md:text-[11px]">
                      {t("achievementLockedHint", { guide: t(unlockKey) })}
                    </p>
                  ) : null}
                </motion.article>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-1.5">
          {ordered.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-4 bg-primary"
                  : "w-1.5 bg-white/20 hover:bg-white/35"
              }`}
              style={
                index === activeIndex && item.tier
                  ? { backgroundColor: PODIUM_COLORS[item.tier] }
                  : undefined
              }
              onClick={() => scrollToIndex(index, { userInitiated: true })}
            />
          ))}
        </div>
      </div>
    </WrappedSlideShell>
  );
}
