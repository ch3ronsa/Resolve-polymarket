import { analyzeMarket } from "@/lib/analysis/market-analysis";
import { listPolymarketEvents } from "@/lib/polymarket/client";
import { getPolymarketMarketBundleBySlug } from "@/lib/polymarket/service";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import { env } from "@/lib/env";
import { generatePersistedWatchlists } from "@/lib/watch/run-generated-watchlists";

type DiscoveryCandidate = {
  slug: string;
  question: string;
  eventSlug: string | null;
  eventTitle: string | null;
  eventCommentCount: number;
  commentsEnabled: boolean;
  volume: number;
  liquidity: number;
  endDate: string | null;
  score: number;
  reasons: string[];
};

function hoursUntil(value: string | null) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return null;
  }

  return (time - Date.now()) / (60 * 60 * 1000);
}

function scoreDiscoveryCandidate(candidate: Omit<DiscoveryCandidate, "score" | "reasons">) {
  const reasons: string[] = [];
  let score = 0;

  if (candidate.volume >= env.SYNC_MIN_VOLUME) {
    score += 30 + Math.min(Math.round(candidate.volume / env.SYNC_MIN_VOLUME), 18);
    reasons.push("volume");
  }

  if (candidate.liquidity >= env.SYNC_MIN_LIQUIDITY) {
    score += 26 + Math.min(Math.round(candidate.liquidity / env.SYNC_MIN_LIQUIDITY), 16);
    reasons.push("liquidity");
  }

  const hours = hoursUntil(candidate.endDate);

  if (hours !== null && hours >= 0 && hours <= env.SYNC_NEAR_RESOLUTION_HOURS) {
    score += 34 + Math.max(0, env.SYNC_NEAR_RESOLUTION_HOURS - Math.round(hours)) / 6;
    reasons.push("near_resolution");
  }

  if (candidate.eventCommentCount >= env.SYNC_MIN_COMMENT_COUNT) {
    score +=
      14 +
      Math.min(
        Math.round(candidate.eventCommentCount * env.SYNC_MARKET_ACTIVITY_WEIGHT),
        18
      );
    reasons.push("comment_activity");
  }

  if (candidate.commentsEnabled) {
    score += 4;
  }

  return {
    score: Math.round(score),
    reasons
  };
}

function isWorthTracking(candidate: DiscoveryCandidate) {
  return candidate.score > 0;
}

export async function syncActiveMarkets(options?: {
  generateWatchlists?: boolean;
  maxMarkets?: number;
}) {
  const discoveryEvents = await listPolymarketEvents({
    active: true,
    closed: false,
    limit: env.SYNC_DISCOVERY_EVENT_LIMIT
  });

  const candidates = discoveryEvents
    .flatMap((event) =>
      event.markets.map((market) => {
        const baseCandidate = {
          slug: market.slug,
          question: market.question,
          eventSlug: event.slug,
          eventTitle: event.title,
          eventCommentCount: event.commentCount ?? 0,
          commentsEnabled: Boolean(market.commentsEnabled ?? event.commentsEnabled ?? false),
          volume: market.volume ?? 0,
          liquidity: market.liquidity ?? 0,
          endDate: market.endDate ?? event.endDate
        };

        const scored = scoreDiscoveryCandidate(baseCandidate);

        return {
          ...baseCandidate,
          score: scored.score,
          reasons: scored.reasons
        } satisfies DiscoveryCandidate;
      })
    )
    .filter(
      (candidate) =>
        candidate.slug &&
        candidate.question &&
        isWorthTracking(candidate)
    )
    .sort((left, right) => right.score - left.score)
    .filter(
      (candidate, index, all) =>
        all.findIndex((other) => other.slug === candidate.slug) === index
    )
    .slice(0, options?.maxMarkets ?? env.SYNC_MARKET_MAX_PER_RUN);

  const synced: Array<{
    slug: string;
    analysisRunId: string | null;
    riskScore: number;
    riskLevel: string;
    commentsFetched: number;
  }> = [];

  for (const candidate of candidates) {
    const bundle = await getPolymarketMarketBundleBySlug(candidate.slug);

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

  return {
    discoveredEvents: discoveryEvents.length,
    candidateCount: candidates.length,
    syncedCount: synced.length,
    synced,
    watchlists,
    thresholds: {
      discoveryEventLimit: env.SYNC_DISCOVERY_EVENT_LIMIT,
      marketMaxPerRun: options?.maxMarkets ?? env.SYNC_MARKET_MAX_PER_RUN,
      minVolume: env.SYNC_MIN_VOLUME,
      minLiquidity: env.SYNC_MIN_LIQUIDITY,
      nearResolutionHours: env.SYNC_NEAR_RESOLUTION_HOURS,
      minCommentCount: env.SYNC_MIN_COMMENT_COUNT
    }
  };
}
