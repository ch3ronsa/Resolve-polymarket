import Link from "next/link";

import type { MarketAnalysisResult } from "@/lib/analysis/market-analysis";
import type { PolymarketMarket } from "@/lib/polymarket/types";

import { Panel } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";

type AnalysisViewProps = {
  market: PolymarketMarket;
  analysis: MarketAnalysisResult;
  persisted: boolean;
  persistenceReason?: string;
  analysisRunId?: string;
  rawMetadata?: {
    market: unknown;
    event?: unknown;
    comments?: unknown;
  };
};

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-[1.5rem] bg-[#f4f6f7] p-4 text-xs leading-6 text-ink">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function AnalysisView({
  market,
  analysis,
  persisted,
  persistenceReason,
  analysisRunId,
  rawMetadata
}: AnalysisViewProps) {
  const primaryUncertainty =
    analysis.ambiguityFlags[0]?.description ||
    analysis.commentSignals[0]?.summary ||
    "The deterministic checks did not find a dominant unresolved issue, but the full rules text can still matter.";

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill risk={analysis.riskLevel} />
              <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate">
                Score {analysis.riskScore}/100
              </span>
              <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate">
                Confidence {analysis.confidenceLevel}
              </span>
              <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate">
                {market.category || "Uncategorized"}
              </span>
            </div>
            <h1 className="mt-5 font-serif text-4xl leading-tight text-ink sm:text-5xl">
              {market.question}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate">{analysis.summary}</p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-signal/12 bg-mist/65 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-signal/75">What this means</p>
              <p className="mt-3 text-sm leading-7 text-ink">{analysis.resolutionSourceSummary}</p>
            </div>
            <div className="rounded-[1.75rem] border border-caution/12 bg-dune/60 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-caution/80">
                What is still uncertain
              </p>
              <p className="mt-3 text-sm leading-7 text-ink">{primaryUncertainty}</p>
            </div>
            <div className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-signal/75">Traceability</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate">
                <p>
                  Analysis engine: <span className="text-ink">{analysis.engineName}</span>
                </p>
                <p>
                  Engine version: <span className="text-ink">{analysis.version}</span>
                </p>
                <p>
                  Analysis run: <span className="text-ink">{analysisRunId ?? "Not stored"}</span>
                </p>
                <p>
                  Storage:{" "}
                  <span className="text-ink">
                    {persisted ? "Saved to database" : persistenceReason || "Not stored"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Panel
          eyebrow="Resolution"
          title="Official source and summary"
          description="The engine starts with the source field and the market wording returned by Polymarket."
        >
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-ink/10 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate">Official resolution source</p>
              <p className="mt-3 text-sm leading-7 text-ink">
                {analysis.resolutionSource || "No explicit resolution source was provided."}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-ink/10 bg-mist/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate">Plain-language explanation</p>
              <p className="mt-3 text-sm leading-7 text-ink">{analysis.resolutionSourceSummary}</p>
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Critical dates"
          title="Dates and timezone notes"
          description={analysis.criticalDatesSummary}
        >
          <div className="space-y-3">
            {analysis.criticalDates.length ? (
              analysis.criticalDates.map((item) => (
                <div
                  key={`${item.label}-${item.iso}`}
                  className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-4 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-ink">{item.label}</p>
                    <p className="text-sm text-slate">{item.display}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate">{item.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white/75 px-4 py-5 text-sm text-slate">
                No clear dates were exposed by the public market payload.
              </div>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {analysis.timezoneNotes.map((note) => (
              <div
                key={note}
                className="rounded-[1.5rem] border border-ink/10 bg-dune/55 px-4 py-4 text-sm leading-6 text-slate"
              >
                {note}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Panel
          eyebrow="Uncertainty"
          title="Ambiguity flags"
          description="These are the main reasons the current market wording may still need a manual rules read."
        >
          <div className="space-y-3">
            {analysis.ambiguityFlags.length ? (
              analysis.ambiguityFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="rounded-[1.5rem] border border-caution/15 bg-caution/5 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-caution">{flag.title}</p>
                    <span className="rounded-full border border-caution/20 bg-white px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-caution">
                      {flag.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-caution">{flag.description}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-signal/15 bg-signal/5 px-4 py-4 text-sm leading-6 text-signal">
                No major ambiguity flags were triggered by the current rule set.
              </div>
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Comments"
          title="Clarification and dispute signals"
          description="If comments were available, the engine scans them for disagreement, clarification, and procedural language."
        >
          <div className="space-y-3">
            {analysis.commentSignals.length ? (
              analysis.commentSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium capitalize text-ink">{signal.kind}</p>
                    <span className="rounded-full border border-ink/10 bg-mist/60 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-slate">
                      {signal.evidenceIds.length} evidence item{signal.evidenceIds.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate">{signal.summary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white/75 px-4 py-5 text-sm text-slate">
                No comment-based disagreement or clarification signals were detected.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel
          eyebrow="Rationale"
          title="Evidence behind the flags"
          description="Each entry ties a heuristic to the field or snippet that triggered it."
        >
          <div className="space-y-3">
            {analysis.evidence.length ? (
              analysis.evidence.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <span className="rounded-full border border-ink/10 bg-mist/60 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-slate">
                      {item.sourceType}
                    </span>
                    <span className="rounded-full border border-ink/10 bg-white px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-slate">
                      {item.sourceField}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate">{item.note}</p>
                  <p className="mt-2 rounded-2xl bg-mist/60 px-3 py-3 text-sm leading-6 text-ink">
                    {item.snippet}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white/75 px-4 py-5 text-sm text-slate">
                No evidence items were produced.
              </div>
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Metadata"
          title="Market facts and raw source metadata"
          description="This section keeps the underlying source fields close at hand for traceability."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.marketFacts.map((fact) => (
              <div
                key={`${fact.label}-${fact.value}`}
                className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate">{fact.label}</p>
                <p className="mt-2 text-sm leading-6 text-ink">{fact.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[1.5rem] border border-ink/10 bg-dune/60 px-4 py-4 text-sm leading-6 text-slate">
            Official market URL:{" "}
            <Link
              href={`https://polymarket.com/event/${market.slug}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink underline decoration-ink/20 underline-offset-4"
            >
              polymarket.com/event/{market.slug}
            </Link>
          </div>

          {rawMetadata ? (
            <details className="mt-4 rounded-[1.5rem] border border-ink/10 bg-white/75 p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink">
                View raw source metadata
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate">Raw market payload</p>
                  <JsonPreview value={rawMetadata.market} />
                </div>
                {rawMetadata.event ? (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate">Raw event payload</p>
                    <JsonPreview value={rawMetadata.event} />
                  </div>
                ) : null}
                {rawMetadata.comments ? (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate">Raw comments payload</p>
                    <JsonPreview value={rawMetadata.comments} />
                  </div>
                ) : null}
              </div>
            </details>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

export function EmptyAnalysisState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel eyebrow="Analysis unavailable" title={title} description={description}>
      <div className="rounded-[1.75rem] border border-dashed border-ink/15 bg-white/70 p-8 text-center">
        <p className="mx-auto max-w-xl text-sm leading-6 text-slate">{description}</p>
        <div className="mt-6 flex justify-center gap-3">
          {action || (
            <Link
              href="/"
              className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-ink/90"
            >
              Return home
            </Link>
          )}
        </div>
      </div>
    </Panel>
  );
}
