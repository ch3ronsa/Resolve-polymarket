import type { PolymarketEvent } from "@/lib/polymarket/types";

import { env } from "@/lib/env";

export type SyncThresholds = {
  discoveryEventLimit: number;
  marketMaxPerRun: number;
  minVolume: number;
  minLiquidity: number;
  nearResolutionHours: number;
  minCommentCount: number;
  marketActivityWeight: number;
};

export type DiscoveryCandidate = {
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

export function getSyncThresholds(overrides: Partial<SyncThresholds> = {}): SyncThresholds {
  return {
    discoveryEventLimit: overrides.discoveryEventLimit ?? env.SYNC_DISCOVERY_EVENT_LIMIT,
    marketMaxPerRun: overrides.marketMaxPerRun ?? env.SYNC_MARKET_MAX_PER_RUN,
    minVolume: overrides.minVolume ?? env.SYNC_MIN_VOLUME,
    minLiquidity: overrides.minLiquidity ?? env.SYNC_MIN_LIQUIDITY,
    nearResolutionHours: overrides.nearResolutionHours ?? env.SYNC_NEAR_RESOLUTION_HOURS,
    minCommentCount: overrides.minCommentCount ?? env.SYNC_MIN_COMMENT_COUNT,
    marketActivityWeight: overrides.marketActivityWeight ?? env.SYNC_MARKET_ACTIVITY_WEIGHT
  };
}

export function hoursUntil(value: string | null, now = Date.now()) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return null;
  }

  return (time - now) / (60 * 60 * 1000);
}

export function scoreDiscoveryCandidate(
  candidate: Omit<DiscoveryCandidate, "score" | "reasons">,
  thresholds = getSyncThresholds(),
  now = Date.now()
) {
  const reasons: string[] = [];
  let score = 0;

  if (candidate.volume >= thresholds.minVolume) {
    score += 30 + Math.min(Math.round(candidate.volume / thresholds.minVolume), 18);
    reasons.push("volume");
  }

  if (candidate.liquidity >= thresholds.minLiquidity) {
    score += 26 + Math.min(Math.round(candidate.liquidity / thresholds.minLiquidity), 16);
    reasons.push("liquidity");
  }

  const hours = hoursUntil(candidate.endDate, now);

  if (hours !== null && hours >= 0 && hours <= thresholds.nearResolutionHours) {
    score += 34 + Math.max(0, thresholds.nearResolutionHours - Math.round(hours)) / 6;
    reasons.push("near_resolution");
  }

  if (candidate.eventCommentCount >= thresholds.minCommentCount) {
    score +=
      14 +
      Math.min(
        Math.round(candidate.eventCommentCount * thresholds.marketActivityWeight),
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

export function isWorthTracking(candidate: DiscoveryCandidate) {
  return candidate.score > 0;
}

export function deriveDiscoveryCandidates(
  events: PolymarketEvent[],
  options?: {
    thresholds?: Partial<SyncThresholds>;
    maxMarkets?: number;
    now?: number;
  }
) {
  const thresholds = getSyncThresholds(options?.thresholds);
  const maxMarkets = options?.maxMarkets ?? thresholds.marketMaxPerRun;
  const now = options?.now ?? Date.now();

  return events
    .flatMap((event) =>
      event.markets
        .filter((market) => market.active && !market.closed)
        .map((market) => {
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

          const scored = scoreDiscoveryCandidate(baseCandidate, thresholds, now);

          return {
            ...baseCandidate,
            score: scored.score,
            reasons: scored.reasons
          } satisfies DiscoveryCandidate;
        })
    )
    .filter((candidate) => candidate.slug && candidate.question && isWorthTracking(candidate))
    .sort((left, right) => right.score - left.score)
    .filter((candidate, index, all) => all.findIndex((other) => other.slug === candidate.slug) === index)
    .slice(0, maxMarkets);
}
