type LogLevel = "info" | "warn" | "error";

function toLogEntry(level: LogLevel, route: string, requestId: string, message: string, details?: unknown) {
  return JSON.stringify({
    level,
    route,
    requestId,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

export function logApiInfo(route: string, requestId: string, message: string, details?: unknown) {
  console.info(toLogEntry("info", route, requestId, message, details));
}

export function logApiError(route: string, requestId: string, error: unknown, details?: Record<string, unknown>) {
  if (error instanceof Error) {
    console.error(
      toLogEntry(route === "/api/health" ? "warn" : "error", route, requestId, error.message, {
        name: error.name,
        ...details
      })
    );
    return;
  }

  console.error(toLogEntry("error", route, requestId, "Unknown API error", { error, ...details }));
}

