import { hasFlag } from "country-flag-icons";

const LANGUAGE_REGION: Record<string, string> = {
  en: "US",
  es: "ES",
  fr: "FR",
  de: "DE",
  it: "IT",
  pt: "PT",
  ja: "JP",
  zh: "CN",
  ko: "KR",
  ar: "SA",
  ru: "RU",
  nl: "NL",
  pl: "PL",
  tr: "TR",
  hi: "IN",
  uk: "UA",
  vi: "VN",
  th: "TH",
  id: "ID",
  cs: "CZ",
  sv: "SE",
  da: "DK",
  fi: "FI",
  nb: "NO",
  ro: "RO",
  hu: "HU",
  el: "GR",
  he: "IL",
  fa: "IR",
  bn: "BD",
  ms: "MY",
  ca: "ES",
};

export function getLocaleRegion(code: string): string | null {
  const normalized = code.trim().toLowerCase();
  const parts = normalized.split("-");

  if (parts.length >= 2 && /^[a-z]{2}$/i.test(parts[1])) {
    return parts[1].toUpperCase();
  }

  const region = LANGUAGE_REGION[parts[0]];
  return region ?? null;
}

export function hasLocaleFlag(code: string): boolean {
  const region = getLocaleRegion(code);
  return region !== null && hasFlag(region);
}
