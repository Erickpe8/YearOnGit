import { NextResponse } from "next/server";
import { isAppError } from "@/lib/errors/app-error";
import { readRequestId } from "@/lib/errors/request-id";
import { normalizeError } from "@/lib/errors/normalize";
import { reportError } from "@/lib/errors/reporter";

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    requestId: string;
    retryable?: boolean;
  };
};

export function jsonOk<T extends Record<string, unknown>>(
  data: T,
  init?: { status?: number; requestId?: string },
) {
  const requestId = init?.requestId ?? readRequestId(new Headers());
  return NextResponse.json(
    { success: true, requestId, ...data },
    {
      status: init?.status ?? 200,
      headers: { "x-request-id": requestId },
    },
  );
}

export function jsonError(
  error: unknown,
  extras?: { requestId?: string; endpoint?: string },
) {
  const appError = isAppError(error)
    ? error
    : normalizeError(error, { requestId: extras?.requestId });
  const requestId = appError.requestId ?? extras?.requestId ?? "yg_unknown";
  reportError(appError, { endpoint: extras?.endpoint, requestId });
  const body: ApiErrorBody = {
    success: false,
    error: {
      code: appError.code,
      message: appError.userMessage,
      requestId,
      retryable: appError.retryable,
    },
  };
  return NextResponse.json(body, {
    status: appError.statusCode ?? 500,
    headers: { "x-request-id": requestId },
  });
}

export function getApiRequestId(request: Request): string {
  return readRequestId(request.headers);
}
