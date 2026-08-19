import type { TranslationKey } from "@/lib/i18n/translations";

export const ERROR_STATUS_CODES = [
  401, 403, 404, 419, 422, 429, 500, 502, 503, 504,
] as const;

export type ErrorStatusCode = (typeof ERROR_STATUS_CODES)[number];

export type ErrorMood =
  | "search"
  | "lock"
  | "auth"
  | "expire"
  | "reject"
  | "wait"
  | "broken"
  | "gateway"
  | "rest"
  | "timeout";

export type ErrorActionId = "home" | "back" | "retry" | "signin" | "reload";

export type ErrorPageConfig = {
  statusCode: ErrorStatusCode | number;
  mood: ErrorMood;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  primaryAction: ErrorActionId;
  secondaryAction?: ErrorActionId;
  showAvailability?: boolean;
};

const PAGES: Record<ErrorStatusCode, ErrorPageConfig> = {
  401: {
    statusCode: 401,
    mood: "auth",
    titleKey: "error401Title",
    descriptionKey: "error401Description",
    primaryAction: "signin",
    secondaryAction: "home",
  },
  403: {
    statusCode: 403,
    mood: "lock",
    titleKey: "error403Title",
    descriptionKey: "error403Description",
    primaryAction: "home",
  },
  404: {
    statusCode: 404,
    mood: "search",
    titleKey: "error404Title",
    descriptionKey: "error404Description",
    primaryAction: "home",
    secondaryAction: "back",
  },
  419: {
    statusCode: 419,
    mood: "expire",
    titleKey: "error419Title",
    descriptionKey: "error419Description",
    primaryAction: "reload",
    secondaryAction: "home",
  },
  422: {
    statusCode: 422,
    mood: "reject",
    titleKey: "error422Title",
    descriptionKey: "error422Description",
    primaryAction: "back",
    secondaryAction: "home",
  },
  429: {
    statusCode: 429,
    mood: "wait",
    titleKey: "rateLimitTitle",
    descriptionKey: "rateLimitDescription",
    primaryAction: "retry",
    secondaryAction: "home",
  },
  500: {
    statusCode: 500,
    mood: "broken",
    titleKey: "error500Title",
    descriptionKey: "error500Description",
    primaryAction: "retry",
    secondaryAction: "home",
  },
  502: {
    statusCode: 502,
    mood: "gateway",
    titleKey: "error502Title",
    descriptionKey: "error502Description",
    primaryAction: "retry",
    secondaryAction: "home",
  },
  503: {
    statusCode: 503,
    mood: "rest",
    titleKey: "error503Title",
    descriptionKey: "error503Description",
    primaryAction: "home",
    showAvailability: true,
  },
  504: {
    statusCode: 504,
    mood: "timeout",
    titleKey: "error504Title",
    descriptionKey: "error504Description",
    primaryAction: "retry",
    secondaryAction: "home",
  },
};

const UNKNOWN: ErrorPageConfig = {
  statusCode: 500,
  mood: "broken",
  titleKey: "errorUnknownTitle",
  descriptionKey: "errorUnknownDescription",
  primaryAction: "home",
};

export function isErrorStatusCode(value: number): value is ErrorStatusCode {
  return (ERROR_STATUS_CODES as readonly number[]).includes(value);
}

export function parseErrorStatusCode(value: string | number): number {
  const code = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(code) || code < 400 || code > 599) return 404;
  return code;
}

export function getErrorPage(code: string | number): ErrorPageConfig {
  const status = parseErrorStatusCode(code);
  if (isErrorStatusCode(status)) return PAGES[status];
  return { ...UNKNOWN, statusCode: status };
}

export const ACTION_LABEL_KEYS: Record<ErrorActionId, TranslationKey> = {
  home: "errorGoHome",
  back: "errorGoBack",
  retry: "errorTryAgain",
  signin: "errorSignIn",
  reload: "errorReload",
};
