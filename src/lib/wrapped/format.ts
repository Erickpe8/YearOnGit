import type { Locale } from "@/lib/i18n/supported-locales";
import { isStaticLocale } from "@/lib/i18n/supported-locales";
import type { WeekdayKey } from "@/lib/wrapped/year";

function resolveLocale(locale: Locale): "en" | "es" {
  return isStaticLocale(locale) ? locale : "en";
}

const MONTH_NAMES: Record<Locale, string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  es: [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ],
};

const WEEKDAY_NAMES: Record<Locale, Record<WeekdayKey, string>> = {
  en: {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
  },
  es: {
    sunday: "domingo",
    monday: "lunes",
    tuesday: "martes",
    wednesday: "miércoles",
    thursday: "jueves",
    friday: "viernes",
    saturday: "sábado",
  },
};

export function formatWrappedDate(
  date: string | null,
  locale: Locale,
): string | null {
  if (!date) return null;

  const parsed = new Date(`${date}T12:00:00.000Z`);
  const lang = resolveLocale(locale);
  return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parsed);
}

export function formatMonthName(month: number | null, locale: Locale): string | null {
  if (!month || month < 1 || month > 12) return null;
  return MONTH_NAMES[resolveLocale(locale)][month - 1] ?? null;
}

const MONTH_ABBREV: Record<"en" | "es", string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
};

export function formatMonthAbbrev(
  month: number | null,
  locale: Locale,
): string | null {
  if (!month || month < 1 || month > 12) return null;
  return MONTH_ABBREV[resolveLocale(locale)][month - 1] ?? null;
}

export function formatWeekdayName(
  weekday: WeekdayKey | null,
  locale: Locale,
): string | null {
  if (!weekday) return null;
  return WEEKDAY_NAMES[resolveLocale(locale)][weekday] ?? null;
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  },
): string {
  const lang = resolveLocale(locale);
  return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", {
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  }).format(value);
}
