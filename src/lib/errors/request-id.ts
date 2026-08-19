const PREFIX = "yg_";

export function createRequestId(): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return PREFIX + Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function readRequestId(headers: Headers): string {
  return headers.get("x-request-id")?.trim() || createRequestId();
}
