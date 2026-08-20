# SEO — YearOnGit

Checklist implementation notes for `Feature/tk10-seo-audit`.

## Done in code

1–5. Unique titles/descriptions per page (`src/lib/seo/pages.ts`); H1 on landing stays the tagline (≠ meta title); search intent documented per page.
6–8. Primary CTA stays on the landing hero (no TL;DR box on welcome).
9–11. Informational H1/H2 on `/how-it-works` and `/faq`; legal pages keep their own structure.
12–13. FAQ content + `FAQPage` JSON-LD on `/faq` (+ `WebApplication` on `/`). LocalBusiness omitted.
14–15. Brand assets already use descriptive `yearongit-*` names; OG alt text improved.
17–20. `src/app/robots.ts`, `src/app/sitemap.ts`, `public/llms.txt`; clean public paths (`/`, `/how-it-works`, `/faq`, `/privacy`, `/terms`, `/share/[slug]`). No `/page/2` pagination exists.
21–22. Mobile sticky CTA; share button on landing; Wrapped summary already has share/copy.
23. GA4 via `NEXT_PUBLIC_GA_MEASUREMENT_ID` + `GoogleAnalytics` component.
25. Dynamic `sitemap.xml` for public pages.

## Manual (Google Search Console)

24. Create a GSC property for the production host (e.g. `https://yearongit.com`).
26. In GSC → Sitemaps, submit `https://<domain>/sitemap.xml`.

### Verification options

- Set `NEXT_PUBLIC_GSC_VERIFICATION` to the Google meta tag token (HTML tag method), redeploy, then verify in GSC.
- Or verify via DNS TXT at your DNS provider.

### Analytics

1. Create a GA4 property and web data stream.
2. Copy Measurement ID (`G-…`) into `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
3. Redeploy; confirm realtime hits on `/`.
