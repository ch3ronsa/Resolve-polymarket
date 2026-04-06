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
};

export function AnalysisView({
  market,
  analysis,
  persisted,
  persistenceReason
}: AnalysisViewProps) {
  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
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
            <h1 className="mt-5 font-serif text-4xl leading-tight text-ink">
              {market.question}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate">{analysis.summary}</p>
          </div>
          <div className="min-w-64 rounded-[1.75rem] border border-ink/10 bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-signal/75">
              Persistence
            </p>
            <p className="mt-3 text-sm leading-6 text-slate">
              {persisted
                ? `This analysis was written to the configured database with engine version ${analysis.version}.`
                : persistenceReason ||
                  "Database storage is not configured yet, so this result is being shown live only."}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel
          eyebrow="Resolution source"
          title="How the source of truth looks right now"
          description="A deterministic summary of the upstream resolution fields, with no LLM interpretation."
        >
          <div className="rounded-[1.75rem] border border-ink/10 bg-white/75 p-5">
            <p className="text-sm leading-7 text-slate">{analysis.resolutionSourceSummary}</p>
          </div>
          <div className="mt-4 rounded-[1.75rem] border border-ink/10 bg-mist/70 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-signal/75">
              Resolution source field
            </p>
            <p className="mt-3 text-sm leading-6 text-ink">
              {analysis.resolutionSource || "No explicit resolution source was provided."}
            </p>
          </div>
        </Panel>

        <Panel
          eyebrow="Critical dates"
          title="Date and deadline read"
          description={analysis.criticalDatesSummary}
        >
          <div className="grid gap-3">
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
                className="rounded-[1.5rem] border border-ink/10 bg-dune/60 px-4 py-4 text-sm leading-6 text-slate"
              >
                {note}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel
          eyebrow="Ambiguity flags"
          title="Items that may deserve a manual rules read"
          description="These are deterministic heuristics tied to specific source fields."
        >
          <div className="space-y-3">
            {analysis.ambiguityFlags.length ? (
              analysis.ambiguityFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="rounded-[1.5rem] border border-caution/15 bg-caution/5 px-4 py-4"
                >
                  <p className="text-sm font-medium text-caution">{flag.title}</p>
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
          title="Dispute and clarification signals"
          description="Comment scanning is heuristic only and meant to highlight potential disagreement, not settle it."
        >
          <div className="space-y-3">
            {analysis.commentSignals.length ? (
              analysis.commentSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-4 py-4"
                >
                  <p className="text-sm font-medium capitalize text-ink">{signal.kind}</p>
                  <p className="mt-2 text-sm leading-6 text-slate">{signal.summary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white/75 px-4 py-5 text-sm text-slate">
                No comment-based dispute or clarification signals were detected.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel
          eyebrow="Evidence"
          title="Why each heuristic fired"
          description="Each evidence item points to a source field or comment snippet that triggered a flag or note."
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
          eyebrow="Market snapshot"
          title="Useful raw facts"
          description="A lightweight snapshot of the public fields most relevant to an initial resolution read."
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
