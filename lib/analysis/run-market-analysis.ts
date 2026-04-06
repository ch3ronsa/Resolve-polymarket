import { analyzeMarket } from "@/lib/analysis/market-analysis";
import type { MarketAnalysisResult } from "@/lib/analysis/market-analysis";
import { getLatestStoredAnalysisBySlug } from "@/lib/db/analysis-read";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import { env } from "@/lib/env";
import { extractPolymarketSlug } from "@/lib/polymarket/slug";
import { getPolymarketMarketBundleBySlug } from "@/lib/polymarket/service";
import type { PolymarketMarket } from "@/lib/polymarket/types";

type AnalysisTriggerSource = "WEB" | "API" | "TELEGRAM" | "SEED" | "MANUAL" | "SYNC";

export type RunMarketAnalysisResult = {
  slug: string;
  market: PolymarketMarket;
  analysis: MarketAnalysisResult;
  analysisRun: {
    id: string;
    createdAt: string;
    triggerSource: AnalysisTriggerSource;
    analysisVersion: string;
    engineName: string;
    cached: boolean;
  };
  commentsFetched: number;
};

export class MarketAnalysisRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "MarketAnalysisRequestError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type RunMarketAnalysisOptions = {
  input: string;
  forceRefresh?: boolean;
  triggerSource?: AnalysisTriggerSource;
};

export async function runMarketAnalysis({
  input,
  forceRefresh = false,
  triggerSource = "API"
}: RunMarketAnalysisOptions): Promise<RunMarketAnalysisResult> {
  if (!env.DATABASE_URL) {
    throw new MarketAnalysisRequestError(
      "STORAGE_UNAVAILABLE",
      "DATABASE_URL must be configured for stored ResolveRadar analysis.",
      503
    );
  }

  const slug = extractPolymarketSlug(input);

  if (!slug) {
    throw new MarketAnalysisRequestError(
      "INVALID_SLUG",
      "Enter a valid Polymarket URL or slug.",
      400
    );
  }

  const cached = await getLatestStoredAnalysisBySlug(slug);

  if (cached && !forceRefresh && cached.isFresh) {
    return {
      slug,
      market: cached.market,
      analysis: cached.analysis,
      analysisRun: {
        ...cached.analysisRun,
        cached: true
      },
      commentsFetched: cached.market.events[0]?.commentCount ?? 0
    };
  }

  const bundle = await getPolymarketMarketBundleBySlug(slug);

  if (!bundle) {
    throw new MarketAnalysisRequestError(
      "MARKET_NOT_FOUND",
      "No market was returned for that slug.",
      404,
      { slug }
    );
  }

  const market = bundle.market.data;
  const analysis = analyzeMarket({
    market,
    event: bundle.event?.data ?? null,
    comments: bundle.comments.data,
    sourceInput: input
  });
  const persistence = await persistMarketAnalysis({
    market,
    rawMarket: bundle.market.raw,
    event: bundle.event?.data ?? null,
    rawEvent: bundle.event?.raw,
    comments: bundle.comments.data,
    rawComments: bundle.comments.raw,
    analysis,
    sourceInput: input,
    triggerSource
  });

  if (!persistence.persisted || !persistence.analysisRunId || !persistence.analysisCreatedAt) {
    throw new MarketAnalysisRequestError(
      "PERSISTENCE_UNAVAILABLE",
      persistence.reason ?? "Analysis could not be persisted.",
      503,
      { slug }
    );
  }

  return {
    slug,
    market,
    analysis,
    analysisRun: {
      id: persistence.analysisRunId,
      createdAt: persistence.analysisCreatedAt,
      triggerSource,
      analysisVersion: analysis.version,
      engineName: analysis.engineName,
      cached: false
    },
    commentsFetched: bundle.comments.data.length
  };
}
