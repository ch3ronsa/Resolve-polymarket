import { randomUUID } from "node:crypto";

import { z } from "zod";

import {
  MarketAnalysisRequestError,
  runMarketAnalysis
} from "@/lib/analysis/run-market-analysis";
import { logApiError, logApiInfo } from "@/lib/api/logging";
import { jsonError, jsonSuccess } from "@/lib/api/responses";
import {
  analyzeDataSchema,
  analyzeRequestSchema,
  successResponseSchema
} from "@/lib/api/schemas";
import { isPolymarketApiError } from "@/lib/polymarket/errors";

const responseSchema = successResponseSchema(analyzeDataSchema);

function parseRequestBody(payload: unknown) {
  const parsed = analyzeRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false as const,
      message:
        parsed.error.flatten().fieldErrors.input?.[0] ??
        parsed.error.flatten().fieldErrors.forceRefresh?.[0] ??
        "Invalid request body."
    };
  }

  return {
    ok: true as const,
    data: parsed.data
  };
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const route = "/api/analyze";

  try {
    const payload = await request.json().catch(() => null);
    const parsed = parseRequestBody(payload);

    if (!parsed.ok) {
      return jsonError({
        requestId,
        code: "INVALID_INPUT",
        message: parsed.message,
        status: 400
      });
    }

    const result = await runMarketAnalysis({
      input: parsed.data.input,
      forceRefresh: parsed.data.forceRefresh,
      triggerSource: "API"
    });

    if (result.analysisRun.cached) {
      logApiInfo(route, requestId, "Returning cached analysis", {
        slug: result.slug,
        analysisRunId: result.analysisRun.id
      });
    }

    return jsonSuccess({
      schema: responseSchema,
      data: {
        slug: result.slug,
        market: result.market,
        analysis: result.analysis,
        analysisRun: result.analysisRun,
        commentsFetched: result.commentsFetched
      },
      trace: {
        requestId,
        analysisRunId: result.analysisRun.id,
        generatedAt: new Date().toISOString(),
        cached: result.analysisRun.cached
      },
      status: 200
    });
  } catch (error) {
    if (error instanceof MarketAnalysisRequestError) {
      logApiError(route, requestId, error, error.details);
      return jsonError({
        requestId,
        code: error.code,
        message: error.message,
        status: error.status,
        details: error.details
      });
    }

    if (isPolymarketApiError(error)) {
      logApiError(route, requestId, error, {
        endpoint: error.endpoint,
        code: error.code
      });

      return jsonError({
        requestId,
        code: error.code,
        message: error.message,
        status: error.status && error.status >= 400 ? error.status : 502,
        details: {
          endpoint: error.endpoint,
          retryable: error.retryable,
          upstreamStatus: error.status
        }
      });
    }

    if (error instanceof z.ZodError) {
      logApiError(route, requestId, error);
      return jsonError({
        requestId,
        code: "RESPONSE_VALIDATION_FAILED",
        message: "The API response did not match the expected schema.",
        status: 500
      });
    }

    logApiError(route, requestId, error);
    return jsonError({
      requestId,
      code: "INTERNAL_ERROR",
      message: "ResolveRadar could not complete the analysis request.",
      status: 500
    });
  }
}
