const SECRET_KEYS = /token|secret|password|authorization|cookie|bearer/i;

export function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.startsWith("gho_") || value.startsWith("ghp_") || value.startsWith("github_pat_")) {
      return "[redacted]";
    }
    if (/Bearer\s+\S+/i.test(value)) {
      return value.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizeLogValue);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = SECRET_KEYS.test(key) ? "[redacted]" : sanitizeLogValue(entry);
    }
    return output;
  }
  return value;
}

export function logAppEvent(
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown> = {},
) {
  const payload = {
    ts: new Date().toISOString(),
    message,
    ...sanitizeLogValue(context) as Record<string, unknown>,
  };
  if (level === "error") console.error("[yearongit]", payload);
  else if (level === "warn") console.warn("[yearongit]", payload);
  else console.info("[yearongit]", payload);
}
