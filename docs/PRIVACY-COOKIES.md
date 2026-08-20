# Privacy, Terms & Cookie Consent

## Routes

- `/privacy` — Privacy Policy (also `/privacidad` → redirect)
- `/terms` — Terms of Service (also `/terminos` → redirect)

Content lives in `src/lib/legal/content.ts` (EN + ES). Other locales fall back to English for the legal document body.

## Cookie banner

- UI: `src/components/legal/cookie-consent-banner.tsx`
- Storage: `localStorage` key `yearongit-cookie-consent` (12 months, versioned)
- Categories: essential (always on), analytics (GA4), preferences
- GA4 (`GoogleAnalytics`) mounts **only** when `analytics: true`
- Re-open via footer **Cookie settings**

## GDPR-style rule

No analytics scripts before an explicit Accept / Customize save that enables analytics.
