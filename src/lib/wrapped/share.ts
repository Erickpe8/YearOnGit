import { randomBytes } from "node:crypto";
import type { WrappedPayload, WrappedStats } from "@/lib/wrapped/types";
import { WRAPPED_YEAR } from "@/lib/wrapped/year";

export const SHARE_SLUG_BYTES = 4;

export function generateShareSlug(): string {
  return randomBytes(SHARE_SLUG_BYTES).toString("hex");
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function buildShareUrl(slug: string, baseUrl = getAppBaseUrl()): string {
  return `${baseUrl}/share/${slug}`;
}

export function isValidShareSlug(slug: string): boolean {
  return /^[a-f0-9]{8}$/i.test(slug);
}

export function toPublicSharePayload(input: {
  stats: WrappedStats;
  username: string;
  year?: number;
}): WrappedPayload {
  return {
    username: input.username.trim().replace(/^@/, ""),
    year: input.year ?? WRAPPED_YEAR,
    stats: input.stats,
  };
}

export function buildShareMetaDescription(payload: WrappedPayload): string {
  const { stats, username, year } = payload;
  const languagePart =
    stats.languageCount > 0
      ? ` · ${stats.languageCount} languages`
      : "";

  return `@${username}'s Year on Git ${year}: ${stats.totalContributions} contributions · ${stats.totalCommits} commits · ${stats.longestStreak}-day streak${languagePart}`;
}

export function buildShareMetaTitle(payload: WrappedPayload): string {
  return `@${payload.username}'s Year on Git ${payload.year}`;
}

export function isWrappedStats(value: unknown): value is WrappedStats {
  if (!value || typeof value !== "object") return false;
  const stats = value as Record<string, unknown>;
  const languages = stats.languages;
  const hasLanguageModule =
    Boolean(languages) &&
    typeof languages === "object" &&
    Array.isArray((languages as { languages?: unknown }).languages);
  return (
    typeof stats.totalContributions === "number" &&
    typeof stats.totalCommits === "number" &&
    typeof stats.activeDays === "number" &&
    typeof stats.longestStreak === "number" &&
    Array.isArray(stats.heatmap) &&
    hasLanguageModule
  );
}
