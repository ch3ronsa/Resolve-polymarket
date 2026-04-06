import { logError, logInfo, logWarn } from "@/lib/logging";

export function logApiInfo(route: string, requestId: string, message: string, details?: unknown) {
  logInfo({
    scope: "api",
    event: route,
    requestId,
    message,
    details
  });
}

export function logApiError(route: string, requestId: string, error: unknown, details?: Record<string, unknown>) {
  if (route === "/api/health") {
    logWarn({
      scope: "api",
      event: route,
      requestId,
      message: error instanceof Error ? error.message : "Unknown API error",
      details: error instanceof Error ? { name: error.name, ...details } : { error, ...details }
    });
    return;
  }

  logError({
    scope: "api",
    event: route,
    requestId,
    error,
    details
  });
}
