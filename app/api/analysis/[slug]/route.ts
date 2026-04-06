import { randomUUID } from "node:crypto";

import { z } from "zod";

import { logApiError } from "@/lib/api/logging";
import { jsonError, jsonSuccess } from "@/lib/api/responses";
import {
  analysisRecordDataSchema,
  successResponseSchema
} from "@/lib/api/schemas";
import { getLatestStoredAnalysisBySlug } from "@/lib/db/analysis-read";
import { env } from "@/lib/env";
import { normalizeSlug } from "@/lib/polymarket/slug";

const responseSchema = successResponseSchema(analysisRecordDataSchema);

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const requestId = randomUUID();
  const route = "/api/analysis/[slug]";

  try {
    const { slug: slugParam } = await context.params;
    const slug = normalizeSlug(slugParam);

    if (!env.DATABASE_URL) {
      return jsonError({
        requestId,
        code: "STORAGE_UNAVAILABLE",
        message: "DATABASE_URL must be configured for the API layer.",
        status: 503
      });
    }

    if (!slug) {
      return jsonError({
        requestId,
        code: "INVALID_SLUG",
        message: "That analysis slug is not valid.",
        status: 400
      });
    }

    const record = await getLatestStoredAnalysisBySlug(slug);

    if (!record) {
      return jsonError({
        requestId,
        code: "ANALYSIS_NOT_FOUND",
        message: "No stored analysis was found for that slug.",
        status: 404,
        details: { slug }
      });
    }

    return jsonSuccess({
      schema: responseSchema,
      data: {
        slug,
        market: record.market,
        analysis: record.analysis,
        analysisRun: {
          ...record.analysisRun,
          cached: true
        }
      },
      trace: {
        requestId,
        analysisRunId: record.analysisRun.id,
        generatedAt: new Date().toISOString(),
        cached: true
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logApiError(route, requestId, error);
      return jsonError({
        requestId,
        code: "RESPONSE_VALIDATION_FAILED",
        message: "Stored analysis did not match the expected schema.",
        status: 500
      });
    }

    logApiError(route, requestId, error);
    return jsonError({
      requestId,
      code: "INTERNAL_ERROR",
      message: "ResolveRadar could not load the stored analysis.",
      status: 500
    });
  }
}
