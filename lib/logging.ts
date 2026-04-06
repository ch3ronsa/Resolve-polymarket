type LogLevel = "info" | "warn" | "error";

type StructuredLogInput = {
  level: LogLevel;
  scope: string;
  event: string;
  message: string;
  requestId?: string;
  details?: unknown;
};

function serializeLog(input: StructuredLogInput) {
  return JSON.stringify({
    level: input.level,
    scope: input.scope,
    event: input.event,
    message: input.message,
    requestId: input.requestId ?? null,
    details: input.details,
    timestamp: new Date().toISOString()
  });
}

export function logInfo(input: Omit<StructuredLogInput, "level">) {
  console.info(serializeLog({ level: "info", ...input }));
}

export function logWarn(input: Omit<StructuredLogInput, "level">) {
  console.warn(serializeLog({ level: "warn", ...input }));
}

export function logError(
  input: Omit<StructuredLogInput, "level" | "message"> & {
    message?: string;
    error?: unknown;
  }
) {
  const message =
    input.message ??
    (input.error instanceof Error ? input.error.message : "Unknown error");
  const details =
    input.error instanceof Error
      ? {
          name: input.error.name,
          ...((input.details as Record<string, unknown> | undefined) ?? {})
        }
      : input.details;

  console.error(
    serializeLog({
      level: "error",
      scope: input.scope,
      event: input.event,
      message,
      requestId: input.requestId,
      details
    })
  );
}
