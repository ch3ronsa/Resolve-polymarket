import { analysisSchema } from "@/lib/api/schemas";
import { getPrismaClient } from "@/lib/db/prisma";

import type { GeneratedWatchEntry, GeneratedWatchKind } from "@/lib/watch/generate-watchlist";

const prismaKindMap = {
  soon_resolution: "SOON_RESOLUTION",
  high_risk: "HIGH_RISK",
  recent_activity: "RECENT_ACTIVITY"
} as const;

function fromPrismaKind(
  kind: "SOON_RESOLUTION" | "HIGH_RISK" | "RECENT_ACTIVITY" | "MANUAL"
) {
  switch (kind) {
    case "SOON_RESOLUTION":
      return "soon_resolution";
    case "HIGH_RISK":
      return "high_risk";
    case "RECENT_ACTIVITY":
      return "recent_activity";
    case "MANUAL":
      return "high_risk";
  }
}

export async function persistGeneratedWatchEntries(
  kind: GeneratedWatchKind,
  entries: GeneratedWatchEntry[]
) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return {
      persisted: false,
      reason: "DATABASE_URL is not configured yet."
    };
  }

  const prismaKind = prismaKindMap[kind];
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const activeSlugs = new Set(entries.map((entry) => entry.slug));

    await tx.watchEntry.updateMany({
      where: {
        kind: prismaKind
      },
      data: {
        enabled: false,
        lastCheckedAt: now
      }
    });

    for (const entry of entries) {
      const market = await tx.market.findUnique({
        where: {
          slug: entry.slug
        },
        select: {
          id: true
        }
      });

      await tx.watchEntry.upsert({
        where: {
          kind_slug: {
            kind: prismaKind,
            slug: entry.slug
          }
        },
        create: {
          kind: prismaKind,
          slug: entry.slug,
          sourceInput: "syncActiveMarkets",
          marketId: market?.id ?? null,
          analysisRunId: entry.analysisRunId,
          enabled: true,
          reason: entry.reason,
          score: entry.score,
          note: `Generated ${kind} watch entry`,
          lastCheckedAt: now,
          lastMatchedAt: now
        },
        update: {
          marketId: market?.id ?? null,
          analysisRunId: entry.analysisRunId,
          enabled: activeSlugs.has(entry.slug),
          reason: entry.reason,
          score: entry.score,
          note: `Generated ${kind} watch entry`,
          lastCheckedAt: now,
          lastMatchedAt: now
        }
      });
    }
  });

  return {
    persisted: true,
    count: entries.length
  };
}

export async function readGeneratedWatchEntries(kind: GeneratedWatchKind, limit: number) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  const entries = await prisma.watchEntry.findMany({
    where: {
      kind: prismaKindMap[kind],
      enabled: true
    },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      market: {
        select: {
          question: true
        }
      },
      analysisRun: {
        select: {
          id: true,
          createdAt: true,
          rawAnalysis: true
        }
      }
    }
  });

  return entries.flatMap((entry) => {
    if (!entry.analysisRun || !entry.market) {
      return [];
    }

    const analysis = analysisSchema.safeParse(entry.analysisRun.rawAnalysis);

    if (!analysis.success) {
      return [];
    }

    const nextCriticalDate =
      analysis.data.criticalDates
        .map((item) => ({
          ...item,
          time: new Date(item.iso).getTime()
        }))
        .filter((item) => Number.isFinite(item.time) && item.time >= Date.now())
        .sort((a, b) => a.time - b.time)[0] ?? null;

    return [
      {
        slug: entry.slug,
        question: entry.market.question,
        kind: fromPrismaKind(entry.kind),
        analysisRunId: entry.analysisRun.id,
        analysisCreatedAt: entry.analysisRun.createdAt.toISOString(),
        riskLevel: analysis.data.riskLevel,
        riskScore: analysis.data.riskScore,
        confidenceLevel: analysis.data.confidenceLevel,
        nextCriticalDate: nextCriticalDate
          ? {
              label: nextCriticalDate.label,
              iso: nextCriticalDate.iso,
              display: nextCriticalDate.display,
              detail: nextCriticalDate.detail
            }
          : null,
        reason: entry.reason ?? "Generated watch entry",
        tracked: true,
        score: entry.score ?? analysis.data.riskScore
      } satisfies GeneratedWatchEntry
    ];
  });
}
