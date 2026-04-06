type TelegramLogLevel = "info" | "warn" | "error";

function toTelegramLogEntry(
  level: TelegramLogLevel,
  event: string,
  message: string,
  details?: unknown
) {
  return JSON.stringify({
    level,
    event,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

export function logTelegramInfo(event: string, message: string, details?: unknown) {
  console.info(toTelegramLogEntry("info", event, message, details));
}

export function logTelegramWarn(event: string, message: string, details?: unknown) {
  console.warn(toTelegramLogEntry("warn", event, message, details));
}

export function logTelegramError(event: string, error: unknown, details?: Record<string, unknown>) {
  if (error instanceof Error) {
    console.error(
      toTelegramLogEntry("error", event, error.message, {
        name: error.name,
        ...details
      })
    );
    return;
  }

  console.error(toTelegramLogEntry("error", event, "Unknown Telegram error", { error, ...details }));
}
