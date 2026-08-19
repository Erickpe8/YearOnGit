export const WRAPPED_YEAR = 2026;

export const WRAPPED_FROM = `${WRAPPED_YEAR}-01-01T00:00:00.000Z`;
export const WRAPPED_TO = `${WRAPPED_YEAR}-12-31T23:59:59.999Z`;

export function wrappedBoundsForYear(year: number) {
  return {
    year,
    from: `${year}-01-01T00:00:00.000Z`,
    to: `${year}-12-31T23:59:59.999Z`,
  };
}

export const WRAPPED_DAYS_IN_YEAR = 365;

export const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export function isWeekendDay(dayIndex: number): boolean {
  return dayIndex === 0 || dayIndex === 6;
}
