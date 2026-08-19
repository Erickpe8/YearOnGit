import { isAppError, type AppError } from "@/lib/errors/app-error";
import { logAppEvent } from "@/lib/errors/logger";
import { normalizeError } from "@/lib/errors/normalize";

export type ErrorReporter = {
  capture: (error: AppError, context?: Record<string, unknown>) => void;
};

const consoleReporter: ErrorReporter = {
  capture(error, context = {}) {
    logAppEvent("error", error.message, {
      code: error.code,
      statusCode: error.statusCode,
      requestId: error.requestId,
      retryable: error.retryable,
      ...context,
    });
  },
};

let reporter: ErrorReporter = consoleReporter;

export function setErrorReporter(next: ErrorReporter | null) {
  reporter = next ?? consoleReporter;
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  const appError = isAppError(error) ? error : normalizeError(error);
  reporter.capture(appError, context);
  return appError;
}
