import type { PolymarketComment, PolymarketEvent, PolymarketMarket } from "@/lib/polymarket/types";

export type ResolutionRiskLabel = "low" | "medium" | "high" | "unknown";
export type ConfidenceLevel = "low" | "medium" | "high";
export type EvidenceSourceType = "market" | "event" | "comment" | "derived";
export type FlagCategory =
  | "resolution_source"
  | "wording"
  | "dates"
  | "timezone"
  | "comments"
  | "structure";
export type FlagSeverity = "low" | "medium" | "high";
export type CommentSignalKind = "dispute" | "clarification" | "procedural";

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

export type AnalysisEvidence = {
  id: string;
  label: string;
  sourceType: EvidenceSourceType;
  sourceField: string;
  snippet: string;
  note: string;
};

export type AnalysisFlag = {
  id: string;
  title: string;
  description: string;
  category: FlagCategory;
  severity: FlagSeverity;
  evidenceIds: string[];
};

export type CommentSignal = {
  id: string;
  kind: CommentSignalKind;
  summary: string;
  evidenceIds: string[];
};

export type MarketAnalysisInput = {
  market: PolymarketMarket;
  event?: PolymarketEvent | null;
  comments?: PolymarketComment[];
  sourceInput?: string;
};

export type MarketAnalysisResult = {
  version: string;
  engineName: string;
  summary: string;
  resolutionSource: string | null;
  resolutionSourceSummary: string;
  criticalDatesSummary: string;
  timezoneNotes: string[];
  ambiguityFlags: AnalysisFlag[];
  commentSignals: CommentSignal[];
  criticalDates: CriticalDate[];
  marketFacts: MarketFact[];
  evidence: AnalysisEvidence[];
  riskScore: number;
  riskLevel: ResolutionRiskLabel;
  confidenceLevel: ConfidenceLevel;
};

export interface AnalysisEngine {
  readonly engineName: string;
  readonly version: string;
  analyze(input: MarketAnalysisInput): MarketAnalysisResult;
}

