import type { PolymarketMarket } from "@/lib/polymarket/types";

export type ResolutionRiskLabel = "low" | "medium" | "high";

export type CriticalDate = {
  label: string;
  iso: string;
  display: string;
  detail: string;
};

export type MarketFact = {
  label: string;
  value: string;
};

export type MarketAnalysisResult = {
  summary: string;
  resolutionSummary: string;
  resolutionSource: string | null;
  ambiguityFlags: string[];
  criticalDates: CriticalDate[];
  marketFacts: MarketFact[];
  riskLabel: ResolutionRiskLabel;
};

const subjectivePattern =
  /\b(significant|major|meaningful|material|substantial|official|announc|launch|deal|approval|ceasefire|ban|win|lose)\w*\b/i;

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(parsed);
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(value);
}

function dedupeDates(dates: CriticalDate[]) {
  const seen = new Set<string>();

  return dates.filter((item) => {
    const key = `${item.label}:${item.iso}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function analyzeMarket(market: PolymarketMarket): MarketAnalysisResult {
  const event = market.events[0];
  const resolutionSource = market.resolutionSource || event?.resolutionSource || null;
  const criticalDates = dedupeDates(
    [
      {
        label: "Market start",
        iso: market.startDate ?? "",
        display: formatDate(market.startDate) ?? "",
        detail: "Opening time returned by the market payload."
      },
      {
        label: "Market end",
        iso: market.endDate ?? "",
        display: formatDate(market.endDate) ?? "",
        detail: "Primary end date exposed by Polymarket."
      },
      {
        label: "UMA deadline",
        iso: market.umaEndDate ?? "",
        display: formatDate(market.umaEndDate) ?? "",
        detail: "UMA-related deadline, when provided."
      },
      {
        label: "Closed time",
        iso: market.closedTime ?? "",
        display: formatDate(market.closedTime) ?? "",
        detail: "Timestamp showing when Polymarket marked the market as closed."
      },
      {
        label: "Event end",
        iso: event?.endDate ?? "",
        display: formatDate(event?.endDate ?? null) ?? "",
        detail: "End date from the parent event, if one was attached."
      },
      {
        label: "Lower bound date",
        iso: market.lowerBoundDate ?? "",
        display: formatDate(market.lowerBoundDate) ?? "",
        detail: "A lower-bound date appears in the market contract fields."
      },
      {
        label: "Upper bound date",
        iso: market.upperBoundDate ?? "",
        display: formatDate(market.upperBoundDate) ?? "",
        detail: "An upper-bound date appears in the market contract fields."
      }
    ].filter((item) => item.iso && item.display)
  );

  const ambiguityFlags: string[] = [];

  if (!resolutionSource) {
    ambiguityFlags.push("No explicit resolution source was returned by the public market payload.");
  }

  if (!market.endDate && !market.umaEndDate && !market.closedTime && !event?.endDate) {
    ambiguityFlags.push("No clear resolution or close date was exposed by Polymarket.");
  }

  if (market.hasReviewedDates === false) {
    ambiguityFlags.push("Polymarket has not marked the dates as reviewed.");
  }

  if (subjectivePattern.test(`${market.question} ${market.description ?? ""}`)) {
    ambiguityFlags.push(
      "The wording includes subjective or context-sensitive terms that may require a full manual rules read."
    );
  }

  if (
    (market.marketType && market.marketType !== "binary") ||
    (market.formatType && market.formatType !== "binary") ||
    (market.outcomes.length > 0 && market.outcomes.length !== 2)
  ) {
    ambiguityFlags.push(
      "This does not look like a standard two-outcome market, so the MVP scoring rules are less reliable."
    );
  }

  if (market.lowerBound || market.upperBound || market.lowerBoundDate || market.upperBoundDate) {
    ambiguityFlags.push(
      "The market includes explicit bounds, which usually means the exact contract language should be checked."
    );
  }

  if (!market.description) {
    ambiguityFlags.push("The public description field is sparse or missing.");
  }

  const severeIssues =
    Number(!resolutionSource) +
    Number(!market.endDate && !market.umaEndDate && !market.closedTime && !event?.endDate) +
    Number(
      (market.marketType && market.marketType !== "binary") ||
        (market.formatType && market.formatType !== "binary")
    );

  let riskLabel: ResolutionRiskLabel = "low";

  if (severeIssues >= 2 || ambiguityFlags.length >= 5) {
    riskLabel = "high";
  } else if (severeIssues >= 1 || ambiguityFlags.length >= 2) {
    riskLabel = "medium";
  }

  const statusText = market.closed
    ? "The market is currently marked as closed."
    : market.active
      ? "The market is currently marked as active."
      : "The current active or closed state is not clearly signaled.";

  const primaryDate =
    criticalDates.find((item) => item.label === "Market end") ??
    criticalDates.find((item) => item.label === "UMA deadline") ??
    criticalDates[0];

  const summary = [
    `${market.question} is a ${market.category?.toLowerCase() || "general"} Polymarket market.`,
    statusText,
    primaryDate
      ? `The main date exposed in the public payload is ${primaryDate.display}.`
      : "No clear resolution date was surfaced in the public payload.",
    resolutionSource
      ? `Polymarket points to ${resolutionSource} as the resolution source.`
      : "No specific resolution source was exposed in the public payload."
  ].join(" ");

  const resolutionSummary = [
    "ResolveRadar reads the market using only deterministic checks on the public Polymarket payload.",
    resolutionSource
      ? `The listed source for resolution is ${resolutionSource}.`
      : "The market does not expose a dedicated resolution source field.",
    market.description
      ? `Description snapshot: ${market.description}`
      : "No descriptive text was returned in the public description field."
  ].join(" ");

  const marketFacts: MarketFact[] = [
    {
      label: "Slug",
      value: market.slug
    },
    {
      label: "Outcomes",
      value: market.outcomes.length ? market.outcomes.join(" / ") : "Not available"
    },
    {
      label: "Liquidity",
      value: formatNumber(market.liquidity)
    },
    {
      label: "Volume",
      value: formatNumber(market.volume)
    },
    {
      label: "Event",
      value: event?.title || "Not available"
    },
    {
      label: "Reviewed dates",
      value:
        market.hasReviewedDates === null
          ? "Not available"
          : market.hasReviewedDates
            ? "Yes"
            : "No"
    }
  ];

  return {
    summary,
    resolutionSummary,
    resolutionSource,
    ambiguityFlags,
    criticalDates,
    marketFacts,
    riskLabel
  };
}

