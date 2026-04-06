import type { AnalysisTriggerSource as PrismaAnalysisTriggerSource } from "@prisma/client";

import type { MarketAnalysisResult } from "@/lib/analysis/market-analysis";
import type { PolymarketComment, PolymarketEvent, PolymarketMarket } from "@/lib/polymarket/types";

import { getPrismaClient } from "@/lib/db/prisma";
import { toJsonValue } from "@/lib/db/json";

type PersistMarketAnalysisInput = {
  market: PolymarketMarket;
  rawMarket: unknown;
  event?: PolymarketEvent | null;
  rawEvent?: unknown;
  comments?: PolymarketComment[];
  rawComments?: unknown;
  analysis: MarketAnalysisResult;
  sourceInput?: string;
  triggerSource?: "WEB" | "API" | "TELEGRAM" | "SEED" | "MANUAL";
};

const riskLabelMap = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  unknown: "UNKNOWN"
} as const;

const confidenceLevelMap = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH"
} as const;

function toDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toFloatArray(values: number[]) {
  return values.filter((value) => Number.isFinite(value));
}

export async function persistMarketAnalysis({
  market,
  rawMarket,
  event = null,
  rawEvent,
  comments = [],
  rawComments = [],
  analysis,
  sourceInput,
  triggerSource = "WEB"
}: PersistMarketAnalysisInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      persisted: false,
      reason: "DATABASE_URL is not configured yet."
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const marketRecord = await tx.market.upsert({
        where: {
          slug: market.slug
        },
        create: {
          polymarketId: market.id,
          primaryEventId: event?.id ?? market.events[0]?.id ?? null,
          slug: market.slug,
          question: market.question,
          description: market.description,
          resolutionSource: market.resolutionSource,
          category: market.category,
          active: market.active,
          closed: market.closed,
          marketType: market.marketType,
          formatType: market.formatType,
          conditionId: market.conditionId,
          commentsEnabled: market.commentsEnabled,
          disqusThread: market.disqusThread,
          hasReviewedDates: market.hasReviewedDates,
          startDate: toDate(market.startDate),
          endDate: toDate(market.endDate),
          umaEndDate: toDate(market.umaEndDate),
          closedTime: toDate(market.closedTime),
          lowerBound: market.lowerBound,
          upperBound: market.upperBound,
          lowerBoundDate: toDate(market.lowerBoundDate),
          upperBoundDate: toDate(market.upperBoundDate),
          outcomes: market.outcomes,
          outcomePrices: toFloatArray(market.outcomePrices),
          liquidity: market.liquidity,
          volume: market.volume,
          eventSlug: event?.slug ?? market.events[0]?.slug ?? null,
          eventTitle: event?.title ?? market.events[0]?.title ?? null,
          eventCategory: event?.category ?? market.events[0]?.category ?? null,
          eventSubcategory: event?.subcategory ?? null,
          eventStartDate: toDate(event?.startDate),
          eventEndDate: toDate(event?.endDate ?? market.events[0]?.endDate),
          eventClosedTime: toDate(event?.closedTime),
          eventCommentCount: event?.commentCount ?? market.events[0]?.commentCount ?? null,
          eventCommentsEnabled: event?.commentsEnabled ?? market.events[0]?.commentsEnabled ?? null,
          rawMarket: toJsonValue(rawMarket),
          rawEvent: rawEvent === undefined ? undefined : toJsonValue(rawEvent),
          syncedAt: new Date()
        },
        update: {
          polymarketId: market.id,
          primaryEventId: event?.id ?? market.events[0]?.id ?? null,
          question: market.question,
          description: market.description,
          resolutionSource: market.resolutionSource,
          category: market.category,
          active: market.active,
          closed: market.closed,
          marketType: market.marketType,
          formatType: market.formatType,
          conditionId: market.conditionId,
          commentsEnabled: market.commentsEnabled,
          disqusThread: market.disqusThread,
          hasReviewedDates: market.hasReviewedDates,
          startDate: toDate(market.startDate),
          endDate: toDate(market.endDate),
          umaEndDate: toDate(market.umaEndDate),
          closedTime: toDate(market.closedTime),
          lowerBound: market.lowerBound,
          upperBound: market.upperBound,
          lowerBoundDate: toDate(market.lowerBoundDate),
          upperBoundDate: toDate(market.upperBoundDate),
          outcomes: market.outcomes,
          outcomePrices: toFloatArray(market.outcomePrices),
          liquidity: market.liquidity,
          volume: market.volume,
          eventSlug: event?.slug ?? market.events[0]?.slug ?? null,
          eventTitle: event?.title ?? market.events[0]?.title ?? null,
          eventCategory: event?.category ?? market.events[0]?.category ?? null,
          eventSubcategory: event?.subcategory ?? null,
          eventStartDate: toDate(event?.startDate),
          eventEndDate: toDate(event?.endDate ?? market.events[0]?.endDate),
          eventClosedTime: toDate(event?.closedTime),
          eventCommentCount: event?.commentCount ?? market.events[0]?.commentCount ?? null,
          eventCommentsEnabled: event?.commentsEnabled ?? market.events[0]?.commentsEnabled ?? null,
          rawMarket: toJsonValue(rawMarket),
          rawEvent: rawEvent === undefined ? undefined : toJsonValue(rawEvent),
          syncedAt: new Date()
        }
      });

      for (const comment of comments) {
        await tx.marketComment.upsert({
          where: {
            polymarketCommentId: comment.id
          },
          create: {
            polymarketCommentId: comment.id,
            marketId: marketRecord.id,
            parentEntityType: comment.parentEntityType,
            parentEntityId: comment.parentEntityId,
            parentCommentId: comment.parentCommentId,
            body: comment.body,
            userAddress: comment.userAddress,
            replyAddress: comment.replyAddress,
            profileName: comment.profileName,
            profileHandle: comment.profileHandle,
            profileImage: comment.profileImage,
            profileWalletAddress: comment.profileWalletAddress,
            reactionCount: comment.reactionCount,
            reportCount: comment.reportCount,
            upstreamCreatedAt: toDate(comment.createdAt),
            upstreamUpdatedAt: toDate(comment.updatedAt),
            rawComment: toJsonValue(
              Array.isArray(rawComments)
                ? rawComments.find((rawComment) => {
                    if (!rawComment || typeof rawComment !== "object") {
                      return false;
                    }

                    return String((rawComment as { id?: unknown }).id ?? "") === comment.id;
                  }) ?? comment
                : comment
            ),
            syncedAt: new Date()
          },
          update: {
            marketId: marketRecord.id,
            parentEntityType: comment.parentEntityType,
            parentEntityId: comment.parentEntityId,
            parentCommentId: comment.parentCommentId,
            body: comment.body,
            userAddress: comment.userAddress,
            replyAddress: comment.replyAddress,
            profileName: comment.profileName,
            profileHandle: comment.profileHandle,
            profileImage: comment.profileImage,
            profileWalletAddress: comment.profileWalletAddress,
            reactionCount: comment.reactionCount,
            reportCount: comment.reportCount,
            upstreamCreatedAt: toDate(comment.createdAt),
            upstreamUpdatedAt: toDate(comment.updatedAt),
            rawComment: toJsonValue(
              Array.isArray(rawComments)
                ? rawComments.find((rawComment) => {
                    if (!rawComment || typeof rawComment !== "object") {
                      return false;
                    }

                    return String((rawComment as { id?: unknown }).id ?? "") === comment.id;
                  }) ?? comment
                : comment
            ),
            syncedAt: new Date()
          }
        });
      }

      const analysisRun = await tx.analysisRun.create({
        data: {
          marketId: marketRecord.id,
          triggerSource: triggerSource as PrismaAnalysisTriggerSource,
          sourceInput: sourceInput ?? market.slug,
          analysisVersion: analysis.version,
          engineName: analysis.engineName,
          summary: analysis.summary,
          resolutionSummary: analysis.resolutionSourceSummary,
          resolutionSource: analysis.resolutionSource,
          criticalDatesSummary: analysis.criticalDatesSummary,
          riskLabel: riskLabelMap[analysis.riskLevel],
          riskScore: analysis.riskScore,
          confidenceLevel: confidenceLevelMap[analysis.confidenceLevel],
          ambiguityFlags: toJsonValue(analysis.ambiguityFlags),
          commentSignals: toJsonValue(analysis.commentSignals),
          criticalDates: toJsonValue(analysis.criticalDates),
          timezoneNotes: toJsonValue(analysis.timezoneNotes),
          evidence: toJsonValue(analysis.evidence),
          marketFacts: toJsonValue(analysis.marketFacts),
          rawAnalysis: toJsonValue(analysis),
          rawUpstream: toJsonValue({
            market: rawMarket,
            event: rawEvent ?? null,
            comments: rawComments
          })
        }
      });

      await tx.watchEntry.updateMany({
        where: {
          slug: market.slug,
          marketId: null
        },
        data: {
          marketId: marketRecord.id,
          lastCheckedAt: new Date()
        }
      });

      return {
        analysisRunId: analysisRun.id,
        commentsStored: comments.length
      };
    });

    return {
      persisted: true,
      analysisRunId: result.analysisRunId,
      commentsStored: result.commentsStored
    };
  } catch (error) {
    console.error("Failed to persist market analysis", error);

    return {
      persisted: false,
      reason: "Database persistence failed."
    };
  }
}
