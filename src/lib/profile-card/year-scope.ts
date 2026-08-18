import { WRAPPED_YEAR } from "@/lib/wrapped/year";

export function wrappedYearEndMs(year: number): number {
  return Date.parse(`${year}-12-31T23:59:59.999Z`);
}

export function wrappedYearStartMs(year: number): number {
  return Date.parse(`${year}-01-01T00:00:00.000Z`);
}

export function isWrappedYearClosed(year: number, now = new Date()): boolean {
  return now.getTime() > wrappedYearEndMs(year);
}

export function canRefreshProfileCardYear(
  year: number,
  now = new Date(),
): boolean {
  const t = now.getTime();
  return t >= wrappedYearStartMs(year) && t <= wrappedYearEndMs(year);
}

export function normalizeCardYear(raw: string | number): number | null {
  const value =
    typeof raw === "number"
      ? raw
      : Number.parseInt(String(raw).replace(/\.png$/i, "").trim(), 10);
  if (!Number.isFinite(value) || value < 2000 || value > 2100) return null;
  return value;
}

export function defaultProfileCardYear(): number {
  return WRAPPED_YEAR;
}
