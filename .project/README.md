# Project Intelligence Index

Mapa de navegación conceptual para agentes. **No sustituye leer el código.**

`truth_rule`: el índice decide QUÉ LEER, no QUÉ ES VERDAD.

## Generar / actualizar

```bash
npm run project:index -- --full
npm run project:index -- --if-stale
npm run project:index -- --check
npm run project:index -- --install-hooks
```

Alias: `npm run index` → `--if-stale`.

## Consultar (stdout = JSON)

```bash
npm run project:query -- overview
npm run project:query -- relevant --q="profile card"
npm run project:query -- context feature.wrapped-stats
npm run project:query -- files feature.share
npm run project:query -- path src/lib/github/client.ts
npm run project:query -- stale
```

Por defecto la query hace `refreshIfStale()` (excepto `stale` y `--no-refresh`).

## Artefactos

| Archivo | Nivel | Commit |
|---------|-------|--------|
| `metadata.json` | 0 | sí |
| `overview.json` | 1 | sí |
| `index.json` | 2 | sí |
| `graph.json` | 3 | sí |
| `filemap.json` | 4 | sí |
| `fingerprints.json` | caché | **no** (gitignore) |

## Stale

`--check` exit 1 si: `missing-index` | `catalog-changed` | `source-files-changed`.  
`working-tree-dirty` / `commit-changed` solo van en `warnings`.

## Catálogo

Fuente: `src/lib/project-index/catalog.ts`. Tras cambiar el catálogo → `project:index --full`.
