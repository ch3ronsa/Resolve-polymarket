import type { ResolutionRiskLabel } from "@/lib/analysis/market-analysis";

const riskStyles: Record<ResolutionRiskLabel, string> = {
  low: "border-signal/20 bg-signal/10 text-signal",
  medium: "border-caution/20 bg-caution/10 text-caution",
  high: "border-danger/20 bg-danger/10 text-danger",
  unknown: "border-slate/20 bg-slate/10 text-slate"
};

export function StatusPill({ risk }: { risk: ResolutionRiskLabel }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${riskStyles[risk]}`}
    >
      {risk} risk
    </span>
  );
}
