import { analyzeMarket } from "@/lib/analysis/market-analysis";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import { logError, logInfo } from "@/lib/logging";
import { listPolymarketEvents } from "@/lib/polymarket/client";
import { getPolymarketMarketBundleBySlug } from "@/lib/polymarket/service";
import { deriveDiscoveryCandidates, getSyncThresholds } from "@/lib/sync/discovery";
import { generatePersistedWatchlists } from "@/lib/watch/run-generated-watchlists";

export async function syncActiveMarkets(options?: {
  generateWatchlists?: boolean;
  maxMarkets?: number;
}) {
  const thresholds = getSyncThresholds({
    marketMaxPerRun: options?.maxMarkets
  });

  logInfo({
    scope: "sync",
    event: "discovery_started",
    message: "Starting active market discovery.",
    details: thresholds
  });

  const discoveryEvents = await listPolymarketEvents({
    active: true,
    closed: false,
    limit: thresholds.discoveryEventLimit
  });

  const candidates = deriveDiscoveryCandidates(discoveryEvents, {
    thresholds,
    maxMarkets: options?.maxMarkets
  });

  const synced: Array<{
    slug: string;
    analysisRunId: string | null;
    riskScore: number;
    riskLevel: string;
    commentsFetched: number;
  }> = [];

  for (const candidate of candidates) {
    const bundle = await getPolymarketMarketBundleBySlug(candidate.slug).catch((error) => {
      logError({
        scope: "sync",
        event: "market_fetch_failed",
        message: "Failed to fetch market bundle during sync.",
        details: {
          slug: candidate.slug
        },
        error
      });
      return null;
    });

    if (!bundle) {
      continue;
    }

    const market = bundle.market.data;

    if (!market.active || market.closed) {
      continue;
    }

    if (
      (market.marketType && market.marketType !== "binary") ||
      (market.formatType && market.formatType !== "binary")
    ) {
      continue;
    }

    const analysis = analyzeMarket({
      market,
      event: bundle.event?.data ?? null,
      comments: bundle.comments.data,
      sourceInput: candidate.slug
    });

    const persistence = await persistMarketAnalysis({
      market,
      rawMarket: bundle.market.raw,
      event: bundle.event?.data ?? null,
      rawEvent: bundle.event?.raw,
      comments: bundle.comments.data,
      rawComments: bundle.comments.raw,
      analysis,
      sourceInput: candidate.slug,
      triggerSource: "SYNC"
    });

    synced.push({
      slug: candidate.slug,
      analysisRunId: persistence.analysisRunId ?? null,
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      commentsFetched: bundle.comments.data.length
    });
  }

  const watchlists =
    options?.generateWatchlists === false ? null : await generatePersistedWatchlists();

  logInfo({
    scope: "sync",
    event: "discovery_completed",
    message: "Active market discovery cycle completed.",
    details: {
      discoveredEvents: discoveryEvents.length,
      candidateCount: candidates.length,
      syncedCount: synced.length
    }
  });

  return {
    discoveredEvents: discoveryEvents.length,
    candidateCount: candidates.length,
    syncedCount: synced.length,
    synced,
    watchlists,
    thresholds
  };
}
