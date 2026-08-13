"use client";

import { motion } from "framer-motion";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  getLanguageIcon,
  LANGUAGE_ICON_MIN_PCT,
} from "@/lib/wrapped/language-icons";
import type { WrappedLanguageStat } from "@/lib/wrapped/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

export const LANGUAGE_PODIUM_LIMIT = 5;

type LanguagesPodiumProps = {
  languages: WrappedLanguageStat[];
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

type PodiumEntry = WrappedLanguageStat & { rank: number };

function podiumHeightPx(rank: number, pct: number, maxPct: number): number {
  const baseByRank = [0, 168, 128, 104, 80, 64][rank] ?? 56;
  const scale = maxPct > 0 ? 0.55 + (pct / maxPct) * 0.45 : 0.7;
  return Math.round(baseByRank * scale);
}

function LanguageBarIcon({ name, pct }: { name: string; pct: number }) {
  if (pct <= LANGUAGE_ICON_MIN_PCT) return null;
  const src = getLanguageIcon(name);
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className="language-podium-icon pointer-events-none mx-auto mt-3 h-7 w-7 shrink-0 object-contain md:mt-4 md:h-8 md:w-8"
      loading="lazy"
      decoding="async"
    />
  );
}

export function LanguagesPodium({ languages, t }: LanguagesPodiumProps) {
  const reducedMotion = usePrefersReducedMotion();
  const top = languages.slice(0, LANGUAGE_PODIUM_LIMIT);
  const maxPct = top[0]?.pct ?? 1;

  if (top.length === 0) {
    return (
      <p className="text-center text-sm text-on-surface-variant">
        {t("noLanguageData")}
      </p>
    );
  }

  const withRank: PodiumEntry[] = top.map((lang, index) => ({
    ...lang,
    rank: index + 1,
  }));

  const first = withRank[0];
  const second = withRank[1];
  const third = withRank[2];
  const rest = withRank.slice(3);

  const podiumOrder = [second, first, third].filter(
    (entry): entry is PodiumEntry => Boolean(entry),
  );

  return (
    <div className="flex min-h-0 w-full max-w-lg flex-1 flex-col justify-center gap-4 px-1">
      <div className="flex min-h-[200px] items-end justify-center gap-2 md:min-h-[240px] md:gap-3">
        {podiumOrder.map((entry, visualIndex) => {
          const height = podiumHeightPx(entry.rank, entry.pct, maxPct);
          const delay = reducedMotion ? 0 : 0.15 + visualIndex * 0.12;

          return (
            <div
              key={entry.name}
              className="flex w-[30%] max-w-[120px] flex-col items-center gap-2"
            >
              <motion.div
                className="flex flex-col items-center gap-1 text-center"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.35, delay: delay + 0.25 }
                }
              >
                <span
                  className={`font-display font-extrabold leading-none text-primary ${
                    entry.rank === 1
                      ? "text-2xl md:text-3xl"
                      : "text-lg md:text-xl"
                  }`}
                >
                  #{entry.rank}
                </span>
                <span
                  className="max-w-full truncate text-[11px] font-medium text-on-surface md:text-sm"
                  title={entry.name}
                >
                  {entry.name}
                </span>
                <span className="font-display text-xs font-bold text-primary md:text-sm">
                  {entry.pct}%
                </span>
              </motion.div>

              <motion.div
                className="flex w-full flex-col items-center overflow-hidden rounded-t-xl"
                style={{ backgroundColor: entry.color }}
                initial={reducedMotion ? false : { height: 0, opacity: 0.4 }}
                animate={{ height, opacity: 1 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        height: {
                          type: "spring",
                          stiffness: 120,
                          damping: 18,
                          delay,
                        },
                        opacity: { duration: 0.3, delay },
                      }
                }
              >
                <LanguageBarIcon name={entry.name} pct={entry.pct} />
              </motion.div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {rest.map((entry, index) => (
            <motion.div
              key={entry.name}
              className="glass-card flex items-center gap-2 rounded-xl px-3 py-2"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.35, delay: 0.55 + index * 0.08 }
              }
            >
              <span className="font-display text-sm font-bold text-primary">
                #{entry.rank}
              </span>
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-on-surface md:text-sm">
                {entry.name}
              </span>
              <span className="shrink-0 font-display text-xs font-bold text-primary">
                {entry.pct}%
              </span>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
