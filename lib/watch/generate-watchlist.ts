import type { CriticalDate } from "@/lib/analysis/market-analysis";

import { env } from "@/lib/env";

export type GeneratedWatchKind = "soon_resolution" | "high_risk" | "recent_activity";

export type StoredMarketWithAnalysis = {
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
  latestCommentCreatedAt: string | null;
  latestCommentCount: number | null;
};

export type GeneratedWatchEntry = {
  slug: string;
  question: string;
  kind: GeneratedWatchKind;
  analysisRunId: string;
  analysisCreatedAt: string;
  riskLevel: "low" | "medium" | "high" | "unknown";
  riskScore: number;
  confidenceLevel: "low" | "medium" | "high";
  nextCriticalDate: CriticalDate | null;
  reason: string;
  tracked: boolean;
  score: number;
  activityEligible?: boolean;
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
  kind: GeneratedWatchKind,
  limit: number
) {
  const soonWindowMs = env.WATCH_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentActivityWindowMs = env.RECENT_ACTIVITY_WINDOW_HOURS * 60 * 60 * 1000;
  const now = Date.now();

  return records
    .map((record) => {
      const nextCriticalDate = findNextCriticalDate(record.analysis.criticalDates);
      const commentAgeMs = record.latestCommentCreatedAt
        ? now - new Date(record.latestCommentCreatedAt).getTime()
        : Number.POSITIVE_INFINITY;
      const recentCommentBoost =
        Number.isFinite(commentAgeMs) && commentAgeMs <= recentActivityWindowMs ? 18 : 0;
      const nearDateBoost =
        nextCriticalDate
          ? Math.max(
              0,
              Math.round(
                (soonWindowMs - Math.max(0, new Date(nextCriticalDate.iso).getTime() - now)) /
                  (24 * 60 * 60 * 1000)
              )
            )
          : 0;

      const score =
        kind === "high_risk"
          ? record.analysis.riskScore
          : kind === "soon_resolution"
            ? nearDateBoost * 10 + Math.min(record.analysis.riskScore, 30)
            : recentCommentBoost +
              Math.min((record.latestCommentCount ?? 0) * 4, 28) +
              Math.min(record.analysis.commentSignals.length * 8, 24) +
              Math.min(record.analysis.riskScore, 20);
      const hasRecentActivity =
        recentCommentBoost > 0 ||
        (record.latestCommentCount ?? 0) >= env.SYNC_MIN_COMMENT_COUNT ||
        record.analysis.commentSignals.length > 0;

      const reason =
        kind === "high_risk"
          ? record.analysis.ambiguityFlags[0]?.title ||
            record.analysis.commentSignals[0]?.summary ||
            "The latest deterministic run still looks meaningfully risky."
          : kind === "soon_resolution"
            ? nextCriticalDate
              ? `${nextCriticalDate.label} is approaching on ${nextCriticalDate.display}.`
              : "A relevant resolution date is approaching."
            : record.analysis.commentSignals[0]?.summary ||
              (record.latestCommentCreatedAt
                ? `Comments or clarification activity appeared recently around ${new Date(
                    record.latestCommentCreatedAt
                  ).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "UTC"
                  })} UTC.`
                : "Recent comment activity suggests the market may deserve another look.");

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
        reason,
        tracked: record.tracked,
        score,
        activityEligible: hasRecentActivity
      } satisfies GeneratedWatchEntry;
    })
    .filter((entry) => {
      if (kind === "high_risk") {
        return entry.riskLevel === "high" || entry.riskLevel === "unknown" || entry.riskScore >= 67;
      }

      if (kind === "soon_resolution") {
        if (!entry.nextCriticalDate) {
          return false;
        }

        const nextTime = new Date(entry.nextCriticalDate.iso).getTime();
        return nextTime >= now && nextTime - now <= soonWindowMs;
      }

      return Boolean(entry.activityEligible) && entry.score >= 20;
    })
    .sort((left, right) => {
      if (kind === "soon_resolution") {
        if (!left.nextCriticalDate || !right.nextCriticalDate) {
          return right.score - left.score;
        }

        return (
          new Date(left.nextCriticalDate.iso).getTime() -
          new Date(right.nextCriticalDate.iso).getTime()
        );
      }

      return right.score - left.score;
    })
    .slice(0, limit);
}

export function mapWatchApiKind(kind: "risky" | "soon"): GeneratedWatchKind {
  return kind === "risky" ? "high_risk" : "soon_resolution";
}
