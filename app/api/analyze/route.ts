import { randomUUID } from "node:crypto";

import { z } from "zod";

import { analyzeMarket } from "@/lib/analysis/market-analysis";
import { logApiError, logApiInfo } from "@/lib/api/logging";
import { jsonError, jsonSuccess } from "@/lib/api/responses";
import {
  analyzeDataSchema,
  analyzeRequestSchema,
  successResponseSchema
} from "@/lib/api/schemas";
import { getLatestStoredAnalysisBySlug } from "@/lib/db/analysis-read";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import { env } from "@/lib/env";
import { isPolymarketApiError } from "@/lib/polymarket/errors";
import { extractPolymarketSlug } from "@/lib/polymarket/slug";
import { getPolymarketMarketBundleBySlug } from "@/lib/polymarket/service";

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

    if (!env.DATABASE_URL) {
      return jsonError({
        requestId,
        code: "STORAGE_UNAVAILABLE",
        message: "DATABASE_URL must be configured for the API layer.",
        status: 503
      });
    }

    const slug = extractPolymarketSlug(parsed.data.input);

    if (!slug) {
      return jsonError({
        requestId,
        code: "INVALID_SLUG",
        message: "Enter a valid Polymarket URL or slug.",
        status: 400
      });
    }

    const cached = await getLatestStoredAnalysisBySlug(slug);

    if (cached && !parsed.data.forceRefresh && cached.isFresh) {
      logApiInfo(route, requestId, "Returning cached analysis", {
        slug,
        analysisRunId: cached.analysisRun.id
      });

      return jsonSuccess({
        schema: responseSchema,
        data: {
          slug,
          market: cached.market,
          analysis: cached.analysis,
          analysisRun: {
            ...cached.analysisRun,
            cached: true
          },
          commentsFetched: cached.market.events[0]?.commentCount ?? 0
        },
        trace: {
          requestId,
          analysisRunId: cached.analysisRun.id,
          generatedAt: new Date().toISOString(),
          cached: true
        }
      });
    }

    const bundle = await getPolymarketMarketBundleBySlug(slug);

    if (!bundle) {
      return jsonError({
        requestId,
        code: "MARKET_NOT_FOUND",
        message: "No market was returned for that slug.",
        status: 404,
        details: { slug }
      });
    }

    const market = bundle.market.data;
    const analysis = analyzeMarket({
      market,
      event: bundle.event?.data ?? null,
      comments: bundle.comments.data,
      sourceInput: parsed.data.input
    });
    const persistence = await persistMarketAnalysis({
      market,
      rawMarket: bundle.market.raw,
      event: bundle.event?.data ?? null,
      rawEvent: bundle.event?.raw,
      comments: bundle.comments.data,
      rawComments: bundle.comments.raw,
      analysis,
      sourceInput: parsed.data.input,
      triggerSource: "API"
    });

    if (!persistence.persisted || !persistence.analysisRunId || !persistence.analysisCreatedAt) {
      logApiError(route, requestId, new Error("Analysis persistence failed"), {
        slug,
        reason: persistence.reason
      });

      return jsonError({
        requestId,
        code: "PERSISTENCE_UNAVAILABLE",
        message: persistence.reason ?? "Analysis could not be persisted.",
        status: 503
      });
    }

    return jsonSuccess({
      schema: responseSchema,
      data: {
        slug,
        market,
        analysis,
        analysisRun: {
          id: persistence.analysisRunId,
          createdAt: persistence.analysisCreatedAt,
          triggerSource: "API",
          analysisVersion: analysis.version,
          engineName: analysis.engineName,
          cached: false
        },
        commentsFetched: bundle.comments.data.length
      },
      trace: {
        requestId,
        analysisRunId: persistence.analysisRunId,
        generatedAt: new Date().toISOString(),
        cached: false
      },
      status: 200
    });
  } catch (error) {
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
