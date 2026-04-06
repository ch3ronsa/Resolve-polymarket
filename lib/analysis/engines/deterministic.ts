import type { PolymarketComment } from "@/lib/polymarket/types";

import type {
  AnalysisEngine,
  AnalysisEvidence,
  AnalysisFlag,
  CommentSignal,
  ConfidenceLevel,
  CriticalDate,
  FlagSeverity,
  MarketAnalysisInput,
  MarketAnalysisResult,
  MarketFact,
  ResolutionRiskLabel
} from "@/lib/analysis/types";

export const DETERMINISTIC_ANALYSIS_VERSION = "deterministic-v1";

const wordingPatterns = [
  { regex: /\bannounce\w*\b/i, title: "Announcement wording", severity: "medium" as const },
  { regex: /\bofficial\b/i, title: "Official source wording", severity: "medium" as const },
  { regex: /\bconfirm\w*\b/i, title: "Confirmation wording", severity: "medium" as const },
  { regex: /\bby\b/i, title: "Boundary wording", severity: "medium" as const },
  { regex: /\bbefore\b/i, title: "Boundary wording", severity: "medium" as const },
  { regex: /\bend of day\b/i, title: "End-of-day wording", severity: "high" as const },
  { regex: /\btake office\b/i, title: "Take-office wording", severity: "high" as const },
  { regex: /\bmidnight\b/i, title: "Midnight wording", severity: "high" as const },
  { regex: /\blocal time\b/i, title: "Local-time wording", severity: "high" as const }
];

const weakResolutionPatterns = [
  /\bofficial sources?\b/i,
  /\bnews reports?\b/i,
  /\bpublic reporting\b/i,
  /\bpolymarket\b/i,
  /\bto be determined\b/i,
  /\bofficial announcement\b/i
];

const disputeCommentPattern =
  /\b(disagree|unclear|ambiguous|wrong|dispute|depends|not sure|uncertain|what if|conflict)\b/i;
const clarificationCommentPattern =
  /\b(clarify|clarification|question|source\?|which source|what counts|does this mean)\b/i;
const proceduralCommentPattern =
  /\b(resolve|resolution|rules|oracle|uma|deadline|timezone|utc|et|eastern|close)\b/i;
const timezoneWordPattern =
  /\b(utc|gmt|est|edt|et|cst|cdt|pst|pdt|local time|timezone|end of day|midnight)\b/i;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

function hasExplicitTimezone(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return /z$/i.test(value) || /[+-]\d{2}:\d{2}$/.test(value);
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

type EvidenceBuilder = {
  add: (item: Omit<AnalysisEvidence, "id">) => string;
  all: () => AnalysisEvidence[];
};

function createEvidenceBuilder(): EvidenceBuilder {
  const items: AnalysisEvidence[] = [];
  let count = 0;

  return {
    add(item) {
      count += 1;
      const id = `ev-${count}`;
      items.push({
        id,
        ...item
      });
      return id;
    },
    all() {
      return items;
    }
  };
}

function addFlag(
  flags: AnalysisFlag[],
  params: Omit<AnalysisFlag, "id">
) {
  flags.push({
    id: `flag-${flags.length + 1}`,
    ...params
  });
}

function addCommentSignal(
  signals: CommentSignal[],
  params: Omit<CommentSignal, "id">
) {
  signals.push({
    id: `comment-${signals.length + 1}`,
    ...params
  });
}

function collectCriticalDates(input: MarketAnalysisInput) {
  const { market, event } = input;
  return dedupeDates(
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
        label: "Event start",
        iso: event?.startDate ?? "",
        display: formatDate(event?.startDate ?? null) ?? "",
        detail: "Start date from the matched event record."
      },
      {
        label: "Event end",
        iso: event?.endDate ?? market.events[0]?.endDate ?? "",
        display: formatDate(event?.endDate ?? market.events[0]?.endDate ?? null) ?? "",
        detail: "End date from the matched event record."
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
}

function scoreFromSeverity(severity: FlagSeverity) {
  switch (severity) {
    case "high":
      return 14;
    case "medium":
      return 9;
    case "low":
      return 5;
  }
}

function createMarketFacts(input: MarketAnalysisInput): MarketFact[] {
  const { market, event, comments = [] } = input;

  return [
    { label: "Slug", value: market.slug },
    { label: "Outcomes", value: market.outcomes.length ? market.outcomes.join(" / ") : "Not available" },
    { label: "Liquidity", value: formatNumber(market.liquidity) },
    { label: "Volume", value: formatNumber(market.volume) },
    { label: "Event", value: event?.title || market.events[0]?.title || "Not available" },
    {
      label: "Reviewed dates",
      value:
        market.hasReviewedDates === null
          ? "Not available"
          : market.hasReviewedDates
            ? "Yes"
            : "No"
    },
    {
      label: "Comments scanned",
      value: String(comments.length)
    }
  ];
}

function buildTimezoneNotes(input: MarketAnalysisInput, criticalDates: CriticalDate[], evidence: EvidenceBuilder) {
  const notes: string[] = [];
  const { market, event } = input;
  const textBlob = [market.question, market.description, market.resolutionSource, event?.description].filter(Boolean).join(" ");

  if (criticalDates.length) {
    notes.push("Structured timestamps from the Polymarket API are rendered in UTC for consistency.");
  }

  const dateFields = [
    { label: "market.endDate", value: market.endDate },
    { label: "market.startDate", value: market.startDate },
    { label: "market.umaEndDate", value: market.umaEndDate },
    { label: "event.endDate", value: event?.endDate ?? null }
  ];

  for (const field of dateFields) {
    if (field.value && !hasExplicitTimezone(field.value)) {
      const evidenceId = evidence.add({
        label: "Timestamp without explicit timezone offset",
        sourceType: field.label.startsWith("event") ? "event" : "market",
        sourceField: field.label,
        snippet: field.value,
        note: "A timestamp-like field appears without an explicit timezone offset."
      });
      notes.push(`${field.label} does not include an explicit timezone offset in the upstream payload.`);
      return { notes, evidenceIds: [evidenceId] };
    }
  }

  if (timezoneWordPattern.test(textBlob)) {
    const match = textBlob.match(timezoneWordPattern)?.[0] ?? "timezone wording";
    const evidenceId = evidence.add({
      label: "Timezone-sensitive wording",
      sourceType: "market",
      sourceField: "question/description/resolutionSource",
      snippet: match,
      note: "The market text uses wording that often depends on a timezone interpretation."
    });
    notes.push("The market wording includes timezone-sensitive language and should be read against the exact rules text.");
    return { notes, evidenceIds: [evidenceId] };
  }

  if (!notes.length) {
    notes.push("No additional timezone-sensitive wording was detected beyond the UTC-formatted timestamps shown here.");
  }

  return { notes, evidenceIds: [] as string[] };
}

function extractCommentEvidence(
  comments: PolymarketComment[],
  regex: RegExp,
  evidence: EvidenceBuilder,
  note: string
) {
  const ids: string[] = [];

  comments.slice(0, 10).forEach((comment) => {
    const body = comment.body ?? "";
    const match = body.match(regex);

    if (match) {
      ids.push(
        evidence.add({
          label: "Comment signal",
          sourceType: "comment",
          sourceField: "body",
          snippet: body.slice(0, 200),
          note: `${note} Trigger phrase: ${match[0]}.`
        })
      );
    }
  });

  return ids;
}

export const deterministicAnalysisEngine: AnalysisEngine = {
  engineName: "deterministic",
  version: DETERMINISTIC_ANALYSIS_VERSION,
  analyze(input: MarketAnalysisInput): MarketAnalysisResult {
    const { market, event = null, comments = [] } = input;
    const evidence = createEvidenceBuilder();
    const flags: AnalysisFlag[] = [];
    const commentSignals: CommentSignal[] = [];
    const criticalDates = collectCriticalDates(input);
    const resolutionSource = market.resolutionSource || event?.resolutionSource || null;
    const sourceSummaryParts = [
      "ResolveRadar is using deterministic checks over the Polymarket market payload.",
      resolutionSource
        ? `The strongest explicit resolution source field currently points to ${resolutionSource}.`
        : "No explicit resolution source field was returned for this market."
    ];

    let riskScore = 8;

    if (!resolutionSource) {
      const evidenceId = evidence.add({
        label: "Missing resolution source",
        sourceType: "market",
        sourceField: "resolutionSource",
        snippet: String(market.resolutionSource ?? "null"),
        note: "The market payload does not expose a dedicated resolution source."
      });
      addFlag(flags, {
        title: "Missing resolution source",
        description: "The public payload does not expose a dedicated resolution source field.",
        category: "resolution_source",
        severity: "high",
        evidenceIds: [evidenceId]
      });
      riskScore += 22;
      sourceSummaryParts.push("That weakens confidence because the source of truth is not named in a dedicated field.");
    } else if (weakResolutionPatterns.some((pattern) => pattern.test(resolutionSource)) || resolutionSource.length < 24) {
      const evidenceId = evidence.add({
        label: "Weak resolution source wording",
        sourceType: market.resolutionSource ? "market" : "event",
        sourceField: market.resolutionSource ? "resolutionSource" : "event.resolutionSource",
        snippet: resolutionSource,
        note: "The resolution source is present, but its wording is generic and may still need manual verification."
      });
      addFlag(flags, {
        title: "Weak resolution source",
        description: "A resolution source exists, but it is generic enough that the exact rule text may still matter.",
        category: "resolution_source",
        severity: "medium",
        evidenceIds: [evidenceId]
      });
      riskScore += 11;
      sourceSummaryParts.push("The source field is present, but the wording looks generic rather than narrowly scoped.");
    } else {
      sourceSummaryParts.push("The source field looks specific enough for an initial deterministic read.");
    }

    if (!criticalDates.length) {
      const evidenceId = evidence.add({
        label: "No critical dates returned",
        sourceType: "derived",
        sourceField: "criticalDates",
        snippet: "[]",
        note: "No date-bearing fields produced a usable critical date."
      });
      addFlag(flags, {
        title: "Missing critical dates",
        description: "The public payload did not expose a clear resolution or deadline timestamp.",
        category: "dates",
        severity: "high",
        evidenceIds: [evidenceId]
      });
      riskScore += 18;
    }

    if (market.hasReviewedDates === false) {
      const evidenceId = evidence.add({
        label: "Dates not reviewed",
        sourceType: "market",
        sourceField: "hasReviewedDates",
        snippet: "false",
        note: "Polymarket explicitly says the dates have not been reviewed."
      });
      addFlag(flags, {
        title: "Dates not reviewed",
        description: "Polymarket has not marked the date fields as reviewed.",
        category: "dates",
        severity: "medium",
        evidenceIds: [evidenceId]
      });
      riskScore += 9;
    }

    const textFields = [
      { sourceField: "question", value: market.question },
      { sourceField: "description", value: market.description ?? "" }
    ];

    for (const pattern of wordingPatterns) {
      const matchField = textFields.find((field) => pattern.regex.test(field.value));

      if (matchField) {
        const match = matchField.value.match(pattern.regex)?.[0] ?? matchField.value;
        const evidenceId = evidence.add({
          label: pattern.title,
          sourceType: "market",
          sourceField: matchField.sourceField,
          snippet: match,
          note: "This wording often needs a closer read of the exact resolution criteria."
        });
        addFlag(flags, {
          title: pattern.title,
          description: `The market text includes "${match}", which often creates interpretation boundaries.`,
          category: pattern.title.includes("time") ? "timezone" : "wording",
          severity: pattern.severity,
          evidenceIds: [evidenceId]
        });
        riskScore += scoreFromSeverity(pattern.severity);
      }
    }

    if (
      (market.marketType && market.marketType !== "binary") ||
      (market.formatType && market.formatType !== "binary") ||
      (market.outcomes.length > 0 && market.outcomes.length !== 2)
    ) {
      const evidenceId = evidence.add({
        label: "Non-standard market structure",
        sourceType: "market",
        sourceField: "marketType/formatType/outcomes",
        snippet: `${market.marketType ?? "unknown"} / ${market.formatType ?? "unknown"} / ${market.outcomes.length} outcomes`,
        note: "The current MVP is most reliable on standard binary markets."
      });
      addFlag(flags, {
        title: "Non-standard market structure",
        description: "This does not look like a standard two-outcome binary market.",
        category: "structure",
        severity: "high",
        evidenceIds: [evidenceId]
      });
      riskScore += 16;
    }

    if (market.lowerBound || market.upperBound || market.lowerBoundDate || market.upperBoundDate) {
      const evidenceId = evidence.add({
        label: "Bounded contract fields",
        sourceType: "market",
        sourceField: "lowerBound/upperBound",
        snippet: `${market.lowerBound ?? "null"} / ${market.upperBound ?? "null"}`,
        note: "Bound fields usually mean the exact contract language deserves a manual read."
      });
      addFlag(flags, {
        title: "Bounded contract fields",
        description: "The market includes explicit bounds, which often add interpretation rules.",
        category: "structure",
        severity: "medium",
        evidenceIds: [evidenceId]
      });
      riskScore += 10;
    }

    if (!market.description) {
      const evidenceId = evidence.add({
        label: "Sparse description",
        sourceType: "market",
        sourceField: "description",
        snippet: "null",
        note: "The description field is missing or empty."
      });
      addFlag(flags, {
        title: "Sparse description",
        description: "The public description field is missing or very light.",
        category: "wording",
        severity: "low",
        evidenceIds: [evidenceId]
      });
      riskScore += 5;
    }

    const timezoneResult = buildTimezoneNotes(input, criticalDates, evidence);

    if (timezoneResult.evidenceIds.length) {
      addFlag(flags, {
        title: "Timezone-sensitive interpretation",
        description: "Some date fields or wording may depend on timezone interpretation.",
        category: "timezone",
        severity: "medium",
        evidenceIds: timezoneResult.evidenceIds
      });
      riskScore += 9;
    }

    const disputeEvidenceIds = extractCommentEvidence(
      comments,
      disputeCommentPattern,
      evidence,
      "Comment text indicates disagreement or ambiguity."
    );
    if (disputeEvidenceIds.length) {
      addCommentSignal(commentSignals, {
        kind: "dispute",
        summary: "Comments include disagreement or ambiguity language.",
        evidenceIds: disputeEvidenceIds
      });
      addFlag(flags, {
        title: "Comment disagreement signals",
        description: "Comments suggest disagreement, uncertainty, or competing interpretations.",
        category: "comments",
        severity: "medium",
        evidenceIds: disputeEvidenceIds
      });
      riskScore += 12;
    }

    const clarificationEvidenceIds = extractCommentEvidence(
      comments,
      clarificationCommentPattern,
      evidence,
      "Comment text asks for clarification about the resolution criteria."
    );
    if (clarificationEvidenceIds.length) {
      addCommentSignal(commentSignals, {
        kind: "clarification",
        summary: "Comments ask for clarification about scope or source of truth.",
        evidenceIds: clarificationEvidenceIds
      });
      riskScore += 7;
    }

    const proceduralEvidenceIds = extractCommentEvidence(
      comments,
      proceduralCommentPattern,
      evidence,
      "Comment text discusses procedural resolution mechanics."
    );
    if (proceduralEvidenceIds.length) {
      addCommentSignal(commentSignals, {
        kind: "procedural",
        summary: "Comments discuss deadlines, rules, or resolution procedure.",
        evidenceIds: proceduralEvidenceIds
      });
      riskScore += 4;
    }

    riskScore = clamp(riskScore, 0, 100);

    const missingCoreFacts =
      Number(!resolutionSource) +
      Number(!criticalDates.length) +
      Number(!market.description);

    const confidenceScore = clamp(
      90 -
        missingCoreFacts * 18 -
        flags.filter((flag) => flag.severity === "high").length * 10 -
        flags.filter((flag) => flag.severity === "medium").length * 4 +
        (comments.length > 0 ? 6 : 0),
      5,
      95
    );

    let confidenceLevel: ConfidenceLevel = "high";
    if (confidenceScore < 45) {
      confidenceLevel = "low";
    } else if (confidenceScore < 75) {
      confidenceLevel = "medium";
    }

    let riskLevel: ResolutionRiskLabel = "low";
    if (!resolutionSource && !criticalDates.length && !market.description) {
      riskLevel = "unknown";
    } else if (riskScore >= 67) {
      riskLevel = "high";
    } else if (riskScore >= 34) {
      riskLevel = "medium";
    }

    const primaryDate = criticalDates[0];
    const summary = [
      `${market.question} is being analyzed with deterministic heuristics only.`,
      market.closed
        ? "The market is currently marked as closed."
        : market.active
          ? "The market is currently marked as active."
          : "The current market status is not clearly signaled.",
      resolutionSource
        ? `A named resolution source is present: ${resolutionSource}.`
        : "No named resolution source is present in the public payload.",
      primaryDate
        ? `The earliest surfaced critical date is ${primaryDate.display}.`
        : "No usable critical date was surfaced from the upstream fields.",
      comments.length
        ? `${comments.length} comment${comments.length === 1 ? "" : "s"} were scanned for dispute and clarification signals.`
        : "No comments were available for additional dispute signals."
    ].join(" ");

    const criticalDatesSummary = criticalDates.length
      ? `The current payload exposes ${criticalDates.length} relevant date field${criticalDates.length === 1 ? "" : "s"}, shown in UTC for consistency.`
      : "No reliable critical dates were exposed by the public payload.";

    return {
      version: DETERMINISTIC_ANALYSIS_VERSION,
      engineName: "deterministic",
      summary,
      resolutionSource,
      resolutionSourceSummary: sourceSummaryParts.join(" "),
      criticalDatesSummary,
      timezoneNotes: timezoneResult.notes,
      ambiguityFlags: flags,
      commentSignals,
      criticalDates,
      marketFacts: createMarketFacts(input),
      evidence: evidence.all(),
      riskScore,
      riskLevel,
      confidenceLevel
    };
  }
};

