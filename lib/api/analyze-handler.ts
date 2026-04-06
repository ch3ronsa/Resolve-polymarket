import { z } from "zod";

import {
  MarketAnalysisRequestError,
  runMarketAnalysis,
  type RunMarketAnalysisResult
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

export type AnalyzeHandlerDeps = {
  runAnalysis?: typeof runMarketAnalysis;
  logInfo?: typeof logApiInfo;
  logError?: typeof logApiError;
  now?: () => Date;
};

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

function toSuccessResponse(
  requestId: string,
  now: () => Date,
  result: RunMarketAnalysisResult
) {
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
      generatedAt: now().toISOString(),
      cached: result.analysisRun.cached
    },
    status: 200
  });
}

export async function handleAnalyzeRequestPayload(
  payload: unknown,
  requestId: string,
  deps: AnalyzeHandlerDeps = {}
) {
  const route = "/api/analyze";
  const runAnalysis = deps.runAnalysis ?? runMarketAnalysis;
  const logInfo = deps.logInfo ?? logApiInfo;
  const logError = deps.logError ?? logApiError;
  const now = deps.now ?? (() => new Date());

  try {
    const parsed = parseRequestBody(payload);

    if (!parsed.ok) {
      return jsonError({
        requestId,
        code: "INVALID_INPUT",
        message: parsed.message,
        status: 400
      });
    }

    const result = await runAnalysis({
      input: parsed.data.input,
      forceRefresh: parsed.data.forceRefresh,
      triggerSource: "API"
    });

    if (result.analysisRun.cached) {
      logInfo(route, requestId, "Returning cached analysis", {
        slug: result.slug,
        analysisRunId: result.analysisRun.id
      });
    }

    return toSuccessResponse(requestId, now, result);
  } catch (error) {
    if (error instanceof MarketAnalysisRequestError) {
      logError(route, requestId, error, error.details);
      return jsonError({
        requestId,
        code: error.code,
        message: error.message,
        status: error.status,
        details: error.details
      });
    }

    if (isPolymarketApiError(error)) {
      logError(route, requestId, error, {
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
      logError(route, requestId, error);
      return jsonError({
        requestId,
        code: "RESPONSE_VALIDATION_FAILED",
        message: "The API response did not match the expected schema.",
        status: 500
      });
    }

    logError(route, requestId, error);
    return jsonError({
      requestId,
      code: "INTERNAL_ERROR",
      message: "ResolveRadar could not complete the analysis request.",
      status: 500
    });
  }
}
