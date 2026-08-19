import {
  FEATURE_CATALOG,
  STAT_CATALOG,
  slideName,
  type FeatureId,
  type SlideId,
  type StatId,
  type WrappedAdminConfig,
} from "@/lib/admin/wrapped-config";

function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function featureName(id: FeatureId): string {
  return FEATURE_CATALOG.find((item) => item.id === id)?.name ?? id;
}

function statName(id: StatId): string {
  return STAT_CATALOG.find((item) => item.id === id)?.name ?? id;
}

export function describeConfigChanges(
  previous: WrappedAdminConfig,
  next: WrappedAdminConfig,
): string[] {
  const changes: string[] = [];

  if (previous.wrappedEnabled !== next.wrappedEnabled) {
    changes.push(
      next.wrappedEnabled
        ? `Wrapped ${next.wrappedYear}: inactivo → activo`
        : `Wrapped ${next.wrappedYear}: activo → inactivo`,
    );
  }

  if (previous.wrappedYear !== next.wrappedYear) {
    changes.push(`Año del Wrapped: ${previous.wrappedYear} → ${next.wrappedYear}`);
  }

  if (
    previous.periodStart !== next.periodStart ||
    previous.periodEnd !== next.periodEnd
  ) {
    changes.push(
      `Periodo: ${formatDay(previous.periodStart)}–${formatDay(previous.periodEnd)} → ${formatDay(next.periodStart)}–${formatDay(next.periodEnd)}`,
    );
  }

  const previousSlides = new Map(
    previous.slides.map((slide) => [slide.id, slide.enabled]),
  );
  for (const slide of next.slides) {
    const wasEnabled = previousSlides.get(slide.id);
    if (wasEnabled === slide.enabled) continue;
    const name = slideName(slide.id as SlideId);
    changes.push(
      `Slide «${name}»: ${wasEnabled ? "ON" : "OFF"} → ${slide.enabled ? "ON" : "OFF"}`,
    );
  }

  const previousOrder = previous.slides.map((slide) => slide.id).join(",");
  const nextOrder = next.slides.map((slide) => slide.id).join(",");
  if (previousOrder !== nextOrder) {
    const names = next.slides
      .map((slide) => slideName(slide.id as SlideId))
      .join(" → ");
    changes.push(`Reordenó las slides: ${names}`);
  }

  for (const feature of FEATURE_CATALOG) {
    if (previous.features[feature.id] === next.features[feature.id]) continue;
    const name = featureName(feature.id);
    changes.push(
      `${name}: ${previous.features[feature.id] ? "ON" : "OFF"} → ${next.features[feature.id] ? "ON" : "OFF"}`,
    );
  }

  for (const stat of STAT_CATALOG) {
    if (previous.stats[stat.id] === next.stats[stat.id]) continue;
    const name = statName(stat.id);
    changes.push(
      `Estadística ${name}: ${previous.stats[stat.id] ? "ON" : "OFF"} → ${next.stats[stat.id] ? "ON" : "OFF"}`,
    );
  }

  if (previous.cacheEpoch !== next.cacheEpoch) {
    changes.push("Limpió la caché de estadísticas");
  }

  return changes;
}

export function summarizeConfigChanges(
  previous: WrappedAdminConfig,
  next: WrappedAdminConfig,
): string | null {
  const changes = describeConfigChanges(previous, next);
  if (changes.length === 0) return null;
  if (changes.length === 1) return changes[0] ?? null;
  const shown = changes.slice(0, 8);
  const extra = changes.length - shown.length;
  const body = shown.map((change) => `• ${change}`).join("\n");
  if (extra <= 0) return body;
  return `${body}\n• y ${extra} cambio${extra === 1 ? "" : "s"} más`;
}

export function displayLogSummary(summary: string): string[] {
  return summary
    .split("\n")
    .map((line) => line.replace(/^•\s*/, "").trim())
    .filter(Boolean);
}

export function logActionLabel(action: string): string {
  switch (action) {
    case "config.update":
      return "Configuración";
    case "config.reset":
      return "Restablecer";
    case "cache.clear":
      return "Caché";
    case "stats.regenerate":
      return "Estadísticas";
    default:
      return action.replaceAll(".", " · ");
  }
}
