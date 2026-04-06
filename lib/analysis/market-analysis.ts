import { deterministicAnalysisEngine } from "@/lib/analysis/engines/deterministic";
import type {
  AnalysisEngine,
  AnalysisFlag,
  AnalysisEvidence,
  CommentSignal,
  ConfidenceLevel,
  CriticalDate,
  MarketAnalysisInput,
  MarketAnalysisResult,
  MarketFact,
  ResolutionRiskLabel
} from "@/lib/analysis/types";

export type {
  AnalysisEngine,
  AnalysisFlag,
  AnalysisEvidence,
  CommentSignal,
  ConfidenceLevel,
  CriticalDate,
  MarketAnalysisInput,
  MarketAnalysisResult,
  MarketFact,
  ResolutionRiskLabel
} from "@/lib/analysis/types";

export const defaultAnalysisEngine: AnalysisEngine = deterministicAnalysisEngine;

export function analyzeMarket(input: MarketAnalysisInput): MarketAnalysisResult {
  return defaultAnalysisEngine.analyze(input);
}
