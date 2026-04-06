import { env } from "@/lib/env";
import { getPrismaClient } from "@/lib/db/prisma";

import type { MarketAnalysisResult } from "@/lib/analysis/market-analysis";
import type { PolymarketMarket } from "@/lib/polymarket/types";

import { analysisSchema } from "@/lib/api/schemas";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

function riskLabelFromDb(value: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN") {
  return value.toLowerCase() as MarketAnalysisResult["riskLevel"];
}

function confidenceLevelFromDb(value: "LOW" | "MEDIUM" | "HIGH") {
  return value.toLowerCase() as MarketAnalysisResult["confidenceLevel"];
}

function mapStoredMarket(record: {
  polymarketId: string;
  conditionId: string | null;
  slug: string;
  question: string;
  description: string | null;
  resolutionSource: string | null;
  endDate: Date | null;
  startDate: Date | null;
  umaEndDate: Date | null;
  closedTime: Date | null;
  lowerBound: string | null;
  upperBound: string | null;
  lowerBoundDate: Date | null;
  upperBoundDate: Date | null;
  category: string | null;
  active: boolean;
  closed: boolean;
  marketType: string | null;
  formatType: string | null;
  hasReviewedDates: boolean | null;
  commentsEnabled: boolean | null;
  disqusThread: string | null;
  outcomes: string[];
  outcomePrices: number[];
  volume: number | null;
  liquidity: number | null;
  primaryEventId: string | null;
  eventSlug: string | null;
  eventTitle: string | null;
  eventEndDate: Date | null;
  eventCategory: string | null;
  eventCommentsEnabled: boolean | null;
  eventCommentCount: number | null;
}) {
  return {
    id: record.polymarketId,
    conditionId: record.conditionId,
    slug: record.slug,
    question: record.question,
    description: record.description,
    resolutionSource: record.resolutionSource,
    endDate: toIsoString(record.endDate),
    startDate: toIsoString(record.startDate),
    umaEndDate: toIsoString(record.umaEndDate),
    closedTime: toIsoString(record.closedTime),
    lowerBound: record.lowerBound,
    upperBound: record.upperBound,
    lowerBoundDate: toIsoString(record.lowerBoundDate),
    upperBoundDate: toIsoString(record.upperBoundDate),
    category: record.category,
    active: record.active,
    closed: record.closed,
    marketType: record.marketType,
    formatType: record.formatType,
    hasReviewedDates: record.hasReviewedDates,
    commentsEnabled: record.commentsEnabled,
    disqusThread: record.disqusThread,
    outcomes: record.outcomes,
    outcomePrices: record.outcomePrices,
    volume: record.volume,
    liquidity: record.liquidity,
    events: [
      {
        id: record.primaryEventId,
        slug: record.eventSlug,
        title: record.eventTitle,
        endDate: toIsoString(record.eventEndDate),
        resolutionSource: null,
        category: record.eventCategory,
        negRisk: false,
        closed: false,
        active: false,
        commentsEnabled: record.eventCommentsEnabled,
        commentCount: record.eventCommentCount
      }
    ].filter((event) => event.id || event.slug || event.title)
  } satisfies PolymarketMarket;
}

function mapStoredAnalysis(rawAnalysis: unknown, fallbacks: {
  summary: string;
  resolutionSummary: string;
  resolutionSource: string | null;
  criticalDatesSummary: string;
  riskLabel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  riskScore: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  analysisVersion: string;
  engineName: string;
}) {
  const parsed = analysisSchema.safeParse(rawAnalysis);

  if (parsed.success) {
    return parsed.data;
  }

  return analysisSchema.parse({
    version: fallbacks.analysisVersion,
    engineName: fallbacks.engineName,
    summary: fallbacks.summary,
    resolutionSource: fallbacks.resolutionSource,
    resolutionSourceSummary: fallbacks.resolutionSummary,
    criticalDatesSummary: fallbacks.criticalDatesSummary,
    timezoneNotes: [],
    ambiguityFlags: [],
    commentSignals: [],
    criticalDates: [],
    marketFacts: [],
    evidence: [],
    riskScore: fallbacks.riskScore,
    riskLevel: riskLabelFromDb(fallbacks.riskLabel),
    confidenceLevel: confidenceLevelFromDb(fallbacks.confidenceLevel)
  });
}

export async function getLatestStoredAnalysisBySlug(slug: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  const record = await prisma.market.findUnique({
    where: {
      slug
    },
    include: {
      watchEntries: {
        where: {
          enabled: true
        },
        take: 1
      },
      analysisRuns: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });

  if (!record || !record.analysisRuns[0]) {
    return null;
  }

  const run = record.analysisRuns[0];
  return {
    slug: record.slug,
    market: mapStoredMarket(record),
    analysis: mapStoredAnalysis(run.rawAnalysis, {
      summary: run.summary,
      resolutionSummary: run.resolutionSummary,
      resolutionSource: run.resolutionSource,
      criticalDatesSummary: run.criticalDatesSummary,
      riskLabel: run.riskLabel,
      riskScore: run.riskScore,
      confidenceLevel: run.confidenceLevel,
      analysisVersion: run.analysisVersion,
      engineName: run.engineName
    }),
    analysisRun: {
      id: run.id,
      createdAt: run.createdAt.toISOString(),
      triggerSource: run.triggerSource,
      analysisVersion: run.analysisVersion,
      engineName: run.engineName
    },
    tracked: Boolean(record.watchEntries[0]),
    isFresh:
      Date.now() - run.createdAt.getTime() <= env.ANALYSIS_CACHE_MAX_AGE_MS
  };
}

export async function listStoredMarketsWithLatestAnalysis(limit: number) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  const records = await prisma.market.findMany({
    take: Math.max(limit * 4, 40),
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      watchEntries: {
        where: {
          enabled: true
        },
        take: 1
      },
      analysisRuns: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });

  return records
    .filter((record) => record.analysisRuns[0])
    .map((record) => {
      const run = record.analysisRuns[0];
      return {
        slug: record.slug,
        question: record.question,
        market: mapStoredMarket(record),
        analysis: mapStoredAnalysis(run.rawAnalysis, {
          summary: run.summary,
          resolutionSummary: run.resolutionSummary,
          resolutionSource: run.resolutionSource,
          criticalDatesSummary: run.criticalDatesSummary,
          riskLabel: run.riskLabel,
          riskScore: run.riskScore,
          confidenceLevel: run.confidenceLevel,
          analysisVersion: run.analysisVersion,
          engineName: run.engineName
        }),
        analysisRun: {
          id: run.id,
          createdAt: run.createdAt.toISOString(),
          triggerSource: run.triggerSource,
          analysisVersion: run.analysisVersion,
          engineName: run.engineName
        },
        tracked: Boolean(record.watchEntries[0])
      };
    });
}
