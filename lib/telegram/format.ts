import { env } from "@/lib/env";
import type { RunMarketAnalysisResult } from "@/lib/analysis/run-market-analysis";
import type { GeneratedWatchEntry } from "@/lib/watch/generate-watchlist";

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function firstUpcomingOrFirstCriticalDate(result: RunMarketAnalysisResult) {
  const now = Date.now();
  const upcoming =
    result.analysis.criticalDates
      .map((entry) => ({
        ...entry,
        time: new Date(entry.iso).getTime()
      }))
      .filter((entry) => Number.isFinite(entry.time) && entry.time >= now)
      .sort((left, right) => left.time - right.time)[0] ?? null;

  if (upcoming) {
    return upcoming;
  }

  return result.analysis.criticalDates[0] ?? null;
}

function buildTopFlags(result: RunMarketAnalysisResult) {
  const ambiguityFlags = result.analysis.ambiguityFlags.map((flag) => flag.title);
  const commentFlags = result.analysis.commentSignals.map((signal) => signal.summary);
  const combined = [...ambiguityFlags, ...commentFlags].filter(Boolean);

  if (combined.length === 0) {
    return "No major ambiguity flags in the latest deterministic pass.";
  }

  return truncate(combined.slice(0, 3).join("; "), 220);
}

function normalizeSourceLine(result: RunMarketAnalysisResult) {
  if (result.analysis.resolutionSourceSummary.trim()) {
    return truncate(result.analysis.resolutionSourceSummary, 220);
  }

  if (result.analysis.resolutionSource) {
    return truncate(result.analysis.resolutionSource, 220);
  }

  return "No strong official resolution source was found in the latest fetch.";
}

function buildWebResultUrl(slug: string) {
  if (!env.NEXT_PUBLIC_APP_URL) {
    return null;
  }

  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  return `${base}/analyze/${slug}`;
}

export function formatTelegramAnalysisReply(result: RunMarketAnalysisResult) {
  const criticalDate = firstUpcomingOrFirstCriticalDate(result);
  const webResultUrl = buildWebResultUrl(result.slug);

  return [
    `${truncate(result.market.question, 220)}`,
    "",
    `Summary: ${truncate(result.analysis.summary, 280)}`,
    `Source: ${normalizeSourceLine(result)}`,
    criticalDate
      ? `Critical date: ${criticalDate.display} (${truncate(criticalDate.detail, 120)})`
      : `Critical date: ${truncate(result.analysis.criticalDatesSummary, 160)}`,
    `Risk: ${result.analysis.riskLevel.toUpperCase()} (${result.analysis.riskScore}/100, confidence ${result.analysis.confidenceLevel})`,
    `Top flags: ${buildTopFlags(result)}`,
    `Web: ${webResultUrl ?? "Set NEXT_PUBLIC_APP_URL to enable direct web result links."}`,
    "Informational summary only. Review the source text directly for final resolution details."
  ].join("\n");
}

function formatWatchEntryLine(entry: GeneratedWatchEntry, index: number) {
  const datePart = entry.nextCriticalDate ? ` | Date: ${entry.nextCriticalDate.display}` : "";
  return `${index + 1}. ${truncate(entry.question, 110)}\nRisk: ${entry.riskLevel.toUpperCase()} (${entry.riskScore}/100)${datePart}\nWhy: ${truncate(entry.reason, 140)}\nWeb: ${buildWebResultUrl(entry.slug) ?? `/analyze/${entry.slug}`}`;
}

export function formatTelegramWatchReply(
  kind: "soon" | "risky",
  entries: GeneratedWatchEntry[],
  generatedAt = new Date().toISOString()
) {
  const title =
    kind === "soon"
      ? "Soon-to-resolve markets"
      : "Higher-risk markets";

  if (entries.length === 0) {
    return `${title}\n\nNo matching markets are stored right now. Run the sync cycle first, then try again.\nInformational summary only.`;
  }

  return [
    `${title}`,
    `Updated: ${new Date(generatedAt).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC"
    })} UTC`,
    "",
    ...entries.map((entry, index) => formatWatchEntryLine(entry, index)),
    "",
    "Informational summary only. ResolveRadar highlights resolution risk, not trading decisions."
  ].join("\n");
}

export function formatTelegramHelpReply() {
  return [
    "ResolveRadar Telegram bot",
    "",
    "/market <url-or-slug> analyzes one Polymarket market.",
    "/watch soon lists stored markets with nearby critical dates.",
    "/watch risky lists stored markets with higher deterministic risk.",
    "",
    "You can also paste a Polymarket market URL directly.",
    "Informational summaries only. No trading guidance is provided."
  ].join("\n");
}
