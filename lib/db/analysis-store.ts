import type { Prisma } from "@prisma/client";

import type { MarketAnalysisResult } from "@/lib/analysis/market-analysis";
import type { PolymarketMarket } from "@/lib/polymarket/types";

import { getPrismaClient } from "@/lib/db/prisma";

type PersistMarketAnalysisInput = {
  market: PolymarketMarket;
  analysis: MarketAnalysisResult;
};

const riskLabelMap = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH"
} as const;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function persistMarketAnalysis({
  market,
  analysis
}: PersistMarketAnalysisInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      persisted: false,
      reason: "DATABASE_URL is not configured yet."
    };
  }

  try {
    await prisma.marketAnalysis.upsert({
      where: {
        slug: market.slug
      },
      create: {
        slug: market.slug,
        marketId: market.id,
        question: market.question,
        summary: analysis.summary,
        resolutionSource: analysis.resolutionSource,
        riskLabel: riskLabelMap[analysis.riskLabel],
        ambiguityFlags: toJsonValue(analysis.ambiguityFlags),
        criticalDates: toJsonValue(analysis.criticalDates),
        rawMarket: toJsonValue(market)
      },
      update: {
        marketId: market.id,
        question: market.question,
        summary: analysis.summary,
        resolutionSource: analysis.resolutionSource,
        riskLabel: riskLabelMap[analysis.riskLabel],
        ambiguityFlags: toJsonValue(analysis.ambiguityFlags),
        criticalDates: toJsonValue(analysis.criticalDates),
        rawMarket: toJsonValue(market),
        lastAnalyzedAt: new Date()
      }
    });

    return {
      persisted: true
    };
  } catch (error) {
    console.error("Failed to persist market analysis", error);

    return {
      persisted: false,
      reason: "Database persistence failed."
    };
  }
}
