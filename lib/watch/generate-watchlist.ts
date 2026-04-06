import type { CriticalDate } from "@/lib/analysis/market-analysis";

import { env } from "@/lib/env";

type StoredMarketWithAnalysis = {
  slug: string;
  question: string;
  analysis: {
    criticalDates: CriticalDate[];
    ambiguityFlags: Array<{ title: string }>;
    commentSignals: Array<{ summary: string }>;
    riskLevel: "low" | "medium" | "high" | "unknown";
    riskScore: number;
    confidenceLevel: "low" | "medium" | "high";
  };
  analysisRun: {
    id: string;
    createdAt: string;
  };
  tracked: boolean;
};

export type GeneratedWatchEntry = {
  slug: string;
  question: string;
  kind: "risky" | "soon";
  analysisRunId: string;
  analysisCreatedAt: string;
  riskLevel: "low" | "medium" | "high" | "unknown";
  riskScore: number;
  confidenceLevel: "low" | "medium" | "high";
  nextCriticalDate: CriticalDate | null;
  reason: string;
  tracked: boolean;
};

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

export function generateWatchEntries(
  records: StoredMarketWithAnalysis[],
  kind: "risky" | "soon",
  limit: number
) {
  const soonWindowMs = env.WATCH_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return records
    .map((record) => {
      const nextCriticalDate = findNextCriticalDate(record.analysis.criticalDates);
      const riskyReason =
        record.analysis.ambiguityFlags[0]?.title ||
        record.analysis.commentSignals[0]?.summary ||
        "Latest analysis marked this market as meaningfully risky.";
      const soonReason = nextCriticalDate
        ? `${nextCriticalDate.label} is coming up on ${nextCriticalDate.display}.`
        : "A relevant date is approaching soon.";

      return {
        slug: record.slug,
        question: record.question,
        kind,
        analysisRunId: record.analysisRun.id,
        analysisCreatedAt: record.analysisRun.createdAt,
        riskLevel: record.analysis.riskLevel,
        riskScore: record.analysis.riskScore,
        confidenceLevel: record.analysis.confidenceLevel,
        nextCriticalDate,
        reason: kind === "risky" ? riskyReason : soonReason,
        tracked: record.tracked
      } satisfies GeneratedWatchEntry;
    })
    .filter((entry) => {
      if (kind === "risky") {
        return entry.riskLevel === "high" || entry.riskLevel === "unknown" || entry.riskScore >= 67;
      }

      if (!entry.nextCriticalDate) {
        return false;
      }

      const nextTime = new Date(entry.nextCriticalDate.iso).getTime();
      return nextTime >= now && nextTime - now <= soonWindowMs;
    })
    .sort((left, right) => {
      if (kind === "risky") {
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
    .slice(0, limit);
}
