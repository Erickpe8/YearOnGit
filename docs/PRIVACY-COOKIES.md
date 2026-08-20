# Privacy, Terms & Cookie Consent

## Rutas

- `/privacy` (redirect desde `/privacidad`)
- `/terms` (redirect desde `/terminos`)

Contenido en `src/lib/legal/content.ts` (EN + ES).

## Cookies

- UI: `src/components/legal/cookie-consent-banner.tsx`
- Storage: `localStorage` → `yearongit-cookie-consent` (12 meses)
- Categorías: esenciales, analítica (GA4), preferencias
- GA4 solo si `analytics: true`
- Reabrir desde el footer: Ajustes de cookies
