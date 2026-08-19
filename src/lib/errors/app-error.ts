import { ERROR_CODES, type AppErrorCode } from "@/lib/errors/codes";

export type AppErrorInit = {
  code: AppErrorCode;
  message: string;
  userMessage: string;
  retryable?: boolean;
  statusCode?: number;
  requestId?: string;
  retryAfterMs?: number;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly requestId?: string;
  readonly retryAfterMs?: number;

  constructor(init: AppErrorInit) {
    super(init.message, init.cause ? { cause: init.cause } : undefined);
    this.name = "AppError";
    this.code = init.code;
    this.userMessage = init.userMessage;
    this.retryable = init.retryable ?? false;
    this.statusCode = init.statusCode;
    this.requestId = init.requestId;
    this.retryAfterMs = init.retryAfterMs;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.userMessage,
      retryable: this.retryable,
      requestId: this.requestId,
    };
  }
}

export class AuthenticationError extends AppError {
  constructor(init: Omit<AppErrorInit, "code">) {
    super({ ...init, code: ERROR_CODES.AUTHENTICATION, retryable: false });
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(init: Omit<AppErrorInit, "code">) {
    super({ ...init, code: ERROR_CODES.AUTHORIZATION, retryable: false });
    this.name = "AuthorizationError";
  }
}

export class RateLimitError extends AppError {
  constructor(init: Omit<AppErrorInit, "code">) {
    super({
      ...init,
      code: ERROR_CODES.RATE_LIMIT,
      retryable: false,
      statusCode: init.statusCode ?? 429,
    });
    this.name = "RateLimitError";
  }
}

export class GitHubApiError extends AppError {
  constructor(init: Omit<AppErrorInit, "code">) {
    super({ ...init, code: ERROR_CODES.GITHUB_API });
    this.name = "GitHubApiError";
  }
}

export class NetworkError extends AppError {
  constructor(init: Omit<AppErrorInit, "code">) {
    super({
      ...init,
      code: init.message.toLowerCase().includes("timeout")
        ? ERROR_CODES.TIMEOUT
        : ERROR_CODES.NETWORK,
      retryable: init.retryable ?? true,
    });
    this.name = "NetworkError";
  }
}

export class ValidationError extends AppError {
  constructor(init: Omit<AppErrorInit, "code">) {
    super({
      ...init,
      code: ERROR_CODES.VALIDATION,
      retryable: false,
      statusCode: init.statusCode ?? 400,
    });
    this.name = "ValidationError";
  }
}

export class DataUnavailableError extends AppError {
  constructor(init: Omit<AppErrorInit, "code">) {
    super({
      ...init,
      code: ERROR_CODES.DATA_UNAVAILABLE,
      retryable: init.retryable ?? true,
    });
    this.name = "DataUnavailableError";
  }
}

export class UnknownApplicationError extends AppError {
  constructor(init: Omit<AppErrorInit, "code">) {
    super({ ...init, code: ERROR_CODES.UNKNOWN, retryable: false });
    this.name = "UnknownApplicationError";
  }
}

export class GitHubGraphQLError extends GitHubApiError {
  status: number;

  constructor(message: string, status = 502, extras?: Partial<AppErrorInit>) {
    super({
      message,
      userMessage: extras?.userMessage ?? message,
      statusCode: status,
      retryable: extras?.retryable ?? [502, 503, 504].includes(status),
      requestId: extras?.requestId,
      retryAfterMs: extras?.retryAfterMs,
      cause: extras?.cause,
    });
    this.name = "GitHubGraphQLError";
    this.status = status;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
