import { randomUUID } from "node:crypto";

import { z } from "zod";

import { logApiError } from "@/lib/api/logging";
import { jsonError, jsonSuccess } from "@/lib/api/responses";
import {
  successResponseSchema,
  watchDataSchema,
  watchQuerySchema
} from "@/lib/api/schemas";
import { listStoredMarketsWithLatestAnalysis } from "@/lib/db/analysis-read";
import { env } from "@/lib/env";
import type { CriticalDate } from "@/lib/analysis/market-analysis";

const responseSchema = successResponseSchema(watchDataSchema);

function findNextCriticalDate(criticalDates: CriticalDate[]): CriticalDate | null {
  const now = Date.now();

  const match =
    criticalDates
    .map((item) => ({
      ...item,
      time: new Date(item.iso).getTime()
    }))
    .filter((item) => Number.isFinite(item.time) && item.time >= now)
    .sort((a, b) => a.time - b.time)[0] ?? null;

  if (!match) {
    return null;
  }

  return {
    label: match.label,
    iso: match.iso,
    display: match.display,
    detail: match.detail
  };
}

export async function GET(request: Request) {
  const requestId = randomUUID();
  const route = "/api/watch";

  try {
    const url = new URL(request.url);
    const parsed = watchQuerySchema.safeParse({
      kind: url.searchParams.get("kind") ?? "risky",
      limit: url.searchParams.get("limit") ?? "20"
    });

    if (!env.DATABASE_URL) {
      return jsonError({
        requestId,
        code: "STORAGE_UNAVAILABLE",
        message: "DATABASE_URL must be configured for the API layer.",
        status: 503
      });
    }

    if (!parsed.success) {
      return jsonError({
        requestId,
        code: "INVALID_QUERY",
        message:
          parsed.error.flatten().fieldErrors.kind?.[0] ??
          parsed.error.flatten().fieldErrors.limit?.[0] ??
          "Invalid watch query.",
        status: 400
      });
    }

    const records = await listStoredMarketsWithLatestAnalysis(parsed.data.limit);
    const soonWindowMs = env.WATCH_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const entries = records
      .map((record) => {
        const nextCriticalDate = findNextCriticalDate(record.analysis.criticalDates);
        const riskyReason =
          record.analysis.ambiguityFlags[0]?.title ||
          record.analysis.commentSignals[0]?.summary ||
          "Latest analysis marked this market as meaningfully risky.";
        const soonReason = nextCriticalDate
          ? `${nextCriticalDate.label} is coming up on ${nextCriticalDate.display}.`
          : "";

        return {
          slug: record.slug,
          question: record.question,
          kind: parsed.data.kind,
          analysisRunId: record.analysisRun.id,
          analysisCreatedAt: record.analysisRun.createdAt,
          riskLevel: record.analysis.riskLevel,
          riskScore: record.analysis.riskScore,
          confidenceLevel: record.analysis.confidenceLevel,
          nextCriticalDate,
          reason: parsed.data.kind === "risky" ? riskyReason : soonReason,
          tracked: record.tracked
        };
      })
      .filter((entry) => {
        if (parsed.data.kind === "risky") {
          return entry.riskLevel === "high" || entry.riskLevel === "unknown" || entry.riskScore >= 67;
        }

        if (!entry.nextCriticalDate) {
          return false;
        }

        const nextTime = new Date(entry.nextCriticalDate.iso).getTime();
        return nextTime >= now && nextTime - now <= soonWindowMs;
      })
      .sort((left, right) => {
        if (parsed.data.kind === "risky") {
          return right.riskScore - left.riskScore;
        }

        if (!left.nextCriticalDate || !right.nextCriticalDate) {
          return 0;
        }

        return (
          new Date(left.nextCriticalDate.iso).getTime() -
          new Date(right.nextCriticalDate.iso).getTime()
        );
      })
      .slice(0, parsed.data.limit);

    return jsonSuccess({
      schema: responseSchema,
      data: {
        kind: parsed.data.kind,
        limit: parsed.data.limit,
        entries
      },
      trace: {
        requestId,
        analysisRunId: entries[0]?.analysisRunId ?? null,
        analysisRunIds: entries.map((entry) => entry.analysisRunId),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logApiError(route, requestId, error);
      return jsonError({
        requestId,
        code: "RESPONSE_VALIDATION_FAILED",
        message: "Generated watch data did not match the expected schema.",
        status: 500
      });
    }

    logApiError(route, requestId, error);
    return jsonError({
      requestId,
      code: "INTERNAL_ERROR",
      message: "ResolveRadar could not build the watch response.",
      status: 500
    });
  }
}
