import { logError, logInfo, logWarn } from "@/lib/logging";

export function logTelegramInfo(event: string, message: string, details?: unknown) {
  logInfo({
    scope: "telegram",
    event,
    message,
    details
  });
}

export function logTelegramWarn(event: string, message: string, details?: unknown) {
  logWarn({
    scope: "telegram",
    event,
    message,
    details
  });
}

export function logTelegramError(event: string, error: unknown, details?: Record<string, unknown>) {
  logError({
    scope: "telegram",
    event,
    error,
    details
  });
}
