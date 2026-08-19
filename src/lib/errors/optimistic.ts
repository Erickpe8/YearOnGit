import { isAppError, type AppError } from "@/lib/errors/app-error";
import { normalizeError } from "@/lib/errors/normalize";
import { reportError } from "@/lib/errors/reporter";

export async function persistWithRollback<T>(options: {
  applyOptimistic: () => void;
  revert: () => void;
  persist: () => Promise<T>;
  context?: Record<string, unknown>;
}): Promise<{ ok: true; data: T } | { ok: false; error: AppError }> {
  options.applyOptimistic();
  try {
    const data = await options.persist();
    return { ok: true, data };
  } catch (error) {
    options.revert();
    const appError = isAppError(error) ? error : normalizeError(error);
    reportError(appError, options.context);
    return { ok: false, error: appError };
  }
}
