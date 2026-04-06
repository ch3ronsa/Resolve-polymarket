import { randomUUID } from "node:crypto";

import { z } from "zod";

import { logApiError } from "@/lib/api/logging";
import { jsonError, jsonSuccess } from "@/lib/api/responses";
import {
  successResponseSchema,
  watchDataSchema,
  watchQuerySchema
} from "@/lib/api/schemas";
import { env } from "@/lib/env";
import { mapWatchApiKind } from "@/lib/watch/generate-watchlist";
import { readGeneratedWatchEntries } from "@/lib/watch/store";

const responseSchema = successResponseSchema(watchDataSchema);

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const route = "/api/watch";

  try {
    const url = new URL(request.url);
    const parsed = watchQuerySchema.safeParse({
      kind: url.searchParams.get("kind") ?? "risky",
      limit: url.searchParams.get("limit") ?? "20"
    });

    if (!env.DATABASE_URL) {
      return jsonError({
        requestId,
        code: "STORAGE_UNAVAILABLE",
        message: "DATABASE_URL must be configured for the API layer.",
        status: 503
      });
    }

    if (!parsed.success) {
      return jsonError({
        requestId,
        code: "INVALID_QUERY",
        message:
          parsed.error.flatten().fieldErrors.kind?.[0] ??
          parsed.error.flatten().fieldErrors.limit?.[0] ??
          "Invalid watch query.",
        status: 400
      });
    }

    const internalKind = mapWatchApiKind(parsed.data.kind);
    const storedEntries = await readGeneratedWatchEntries(internalKind, parsed.data.limit);
    const entries = storedEntries.map((entry) => ({
      ...entry,
      kind: parsed.data.kind
    }));

    return jsonSuccess({
      schema: responseSchema,
      data: {
        kind: parsed.data.kind,
        limit: parsed.data.limit,
        entries
      },
      trace: {
        requestId,
        analysisRunId: entries[0]?.analysisRunId ?? null,
        analysisRunIds: entries.map((entry) => entry.analysisRunId),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logApiError(route, requestId, error);
      return jsonError({
        requestId,
        code: "RESPONSE_VALIDATION_FAILED",
        message: "Generated watch data did not match the expected schema.",
        status: 500
      });
    }

    logApiError(route, requestId, error);
    return jsonError({
      requestId,
      code: "INTERNAL_ERROR",
      message: "ResolveRadar could not build the watch response.",
      status: 500
    });
  }
}
