import { getAppBaseUrl } from "@/lib/app-url";
import { getProfileCardCopy, profileCardText } from "@/lib/profile-card/copy";
import {
  parseProfileCardLocale,
  profileCardLangSearch,
} from "@/lib/profile-card/locale";
import { defaultProfileCardYear } from "@/lib/profile-card/year-scope";

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export function normalizeProfileUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").replace(/\.png$/i, "").replace(/\.svg$/i, "");
}

export function toProfileUsernameKey(username: string): string {
  return normalizeProfileUsername(username).toLowerCase();
}

export function isValidProfileUsername(username: string): boolean {
  const normalized = normalizeProfileUsername(username);
  return USERNAME_RE.test(normalized);
}

export function buildProfileCardUrl(
  username: string,
  year: number = defaultProfileCardYear(),
  baseUrl?: string,
  locale?: string,
): string {
  const display = normalizeProfileUsername(username);
  const lang = parseProfileCardLocale(locale);
  const root = baseUrl ?? getAppBaseUrl();
  return `${root}/cards/${encodeURIComponent(display)}/${year}.png?${profileCardLangSearch(lang)}`;
}

export function buildProfileCardMarkdown(input: {
  username: string;
  year: number;
  shareSlug?: string;
  baseUrl?: string;
  locale?: string;
}): string {
  const baseUrl = input.baseUrl ?? getAppBaseUrl();
  const locale = parseProfileCardLocale(input.locale);
  const cardUrl = buildProfileCardUrl(
    input.username,
    input.year,
    baseUrl,
    locale,
  );
  const href = input.shareSlug
    ? `${baseUrl}/share/${input.shareSlug}`
    : baseUrl;
  const copy = getProfileCardCopy(locale);
  const alt = profileCardText(copy, "markdownAlt", {
    username: normalizeProfileUsername(input.username),
    year: input.year,
  });
  return `[![${alt}](${cardUrl})](${href})`;
}
