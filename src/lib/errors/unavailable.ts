export function isUnavailable(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isZeroCount(value: unknown): value is 0 {
  return value === 0;
}
