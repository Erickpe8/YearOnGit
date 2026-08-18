import { resolveLocale, type Locale } from "@/lib/i18n/supported-locales";
import type { WeekdayKey } from "@/lib/wrapped/year";

const INTL_LOCALES: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
  it: "it-IT",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  ar: "ar-SA",
};

function getIntlLocale(locale: string): string {
  return INTL_LOCALES[resolveLocale(locale)] ?? "en-US";
}

export function formatWrappedDate(
  date: string | null,
  locale: string,
): string | null {
  if (!date) return null;

  const parsed = new Date(`${date}T12:00:00.000Z`);
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parsed);
}

export function formatMonthName(month: number | null, locale: string): string | null {
  if (!month || month < 1 || month > 12) return null;

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, month - 1, 1)));
}

export function formatMonthAbbrev(
  month: number | null,
  locale: string,
): string | null {
  if (!month || month < 1 || month > 12) return null;

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, month - 1, 1)));
}

const WEEKDAY_INDEX: Record<WeekdayKey, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function weekdayDate(weekday: WeekdayKey): Date {
  return new Date(Date.UTC(2026, 0, 4 + WEEKDAY_INDEX[weekday]));
}

export function formatWeekdayName(
  weekday: WeekdayKey | null,
  locale: string,
): string | null {
  if (!weekday) return null;

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    weekday: "long",
    timeZone: "UTC",
  }).format(weekdayDate(weekday));
}

export function formatWeekdayNarrow(
  weekday: WeekdayKey | null,
  locale: string,
): string | null {
  if (!weekday) return null;

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    weekday: "narrow",
    timeZone: "UTC",
  }).format(weekdayDate(weekday));
}

export function formatNumber(
  value: number,
  locale: string,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  },
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  }).format(value);
}
