export const CONSENT_STORAGE_KEY = "yearongit-cookie-consent";
export const CONSENT_VERSION = 1;
/** How long we honor a stored choice before asking again (12 months). */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export type ConsentPreferences = {
  version: number;
  /** Always true — session, security, consent record. */
  essential: true;
  /** GA4 and similar. Off until explicit accept. */
  analytics: boolean;
  /** Non-essential preference cookies beyond essential local prefs. */
  preferences: boolean;
  updatedAt: number;
};

export const DEFAULT_DENIED_CONSENT: ConsentPreferences = {
  version: CONSENT_VERSION,
  essential: true,
  analytics: false,
  preferences: false,
  updatedAt: 0,
};

export function isConsentFresh(consent: ConsentPreferences): boolean {
  if (!consent.updatedAt || consent.version !== CONSENT_VERSION) return false;
  return Date.now() - consent.updatedAt < CONSENT_MAX_AGE_MS;
}

export function readStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (
      typeof parsed !== "object" ||
      parsed == null ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.preferences !== "boolean"
    ) {
      return null;
    }
    const consent: ConsentPreferences = {
      version: CONSENT_VERSION,
      essential: true,
      analytics: parsed.analytics,
      preferences: parsed.preferences,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
    return isConsentFresh(consent) ? consent : null;
  } catch {
    return null;
  }
}

export function writeStoredConsent(
  partial: Pick<ConsentPreferences, "analytics" | "preferences">,
): ConsentPreferences {
  const consent: ConsentPreferences = {
    version: CONSENT_VERSION,
    essential: true,
    analytics: partial.analytics,
    preferences: partial.preferences,
    updatedAt: Date.now(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  }
  return consent;
}

export function clearStoredConsent() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  }
}
