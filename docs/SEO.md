# SEO — YearOnGit

## En código

- Metadata por página en `src/lib/seo/pages.ts`
- `/how-it-works`, `/faq` (FAQPage JSON-LD), `/privacy`, `/terms`
- `robots.ts`, `sitemap.ts`, `public/llms.txt`
- GA4 con `NEXT_PUBLIC_GA_MEASUREMENT_ID` (solo tras consentimiento)
- CTA sticky móvil y botón compartir en landing

## Manual

1. Crear propiedad en Google Search Console.
2. Enviar `https://<dominio>/sitemap.xml`.
3. Verificar con `NEXT_PUBLIC_GSC_VERIFICATION` o DNS TXT.
4. Crear GA4 y copiar el Measurement ID a `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
