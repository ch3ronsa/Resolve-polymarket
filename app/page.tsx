import Link from "next/link";

import { MarketUrlForm } from "@/components/market-url-form";
import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";

const deliverables = [
  {
    title: "What this means",
    description:
      "A short explanation of what the market seems to resolve on, written in plain language."
  },
  {
    title: "What is still uncertain",
    description:
      "Flags for wording, date boundaries, timezone issues, and missing source clarity."
  },
  {
    title: "Why the flags fired",
    description:
      "Evidence cards tie each heuristic back to a field or comment snippet from the source payload."
  }
];

const principles = [
  "No trading framing",
  "Deterministic first",
  "Shareable pages",
  "Traceable evidence"
];

const workflow = [
  "Paste a Polymarket URL or slug.",
  "ResolveRadar fetches the official market payload and comments when available.",
  "The app stores a versioned analysis run and shows the result on a stable page."
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 pb-16 pt-6">
      <div className="mx-auto max-w-6xl">
        <SiteHeader />
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel className="overflow-hidden">
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-28 rounded-[2rem] bg-gradient-to-r from-tide/90 via-white/70 to-dune/80 blur-2xl" />
              <div className="relative">
                <p className="text-sm uppercase tracking-[0.28em] text-signal/75">
                  Resolve Polymarket markets with more context
                </p>
                <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
                  A calm, evidence-backed read of how a market is supposed to resolve.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate">
                  ResolveRadar fetches the official Polymarket market data, surfaces
                  the fields that matter most, and explains where uncertainty still sits.
                  It is built to help you read the rules more carefully, not to push a position.
                </p>
                <div className="mt-8">
                  <MarketUrlForm />
                </div>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate">
                  {principles.map((principle) => (
                    <span
                      key={principle}
                      className="rounded-full border border-ink/10 bg-white/70 px-4 py-2"
                    >
                      {principle}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            eyebrow="What you get"
            title="One analysis page, four core answers"
            description="The analysis page is meant to be scanned top to bottom on mobile or desktop without feeling like a terminal."
          >
            <div className="space-y-4">
              {deliverables.map((signal) => (
                <div
                  key={signal.title}
                  className="rounded-3xl border border-ink/10 bg-white/75 p-5"
                >
                  <p className="font-medium text-ink">{signal.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel
            eyebrow="How it works"
            title="A narrow, deterministic workflow"
            description="The MVP keeps the pipeline intentionally simple so each result can be traced back to upstream fields."
          >
            <div className="space-y-3">
              {workflow.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-[1.5rem] border border-ink/10 bg-white/75 p-4 text-sm leading-6 text-slate"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            eyebrow="Explore"
            title="Try the product flow"
            description="Open a real analysis page or review the current watchlist view."
          >
            <div className="grid gap-3 text-sm text-slate">
              <Link
                href="/analyze/will-bitcoin-reach-150k-in-2026"
                className="rounded-2xl border border-ink/10 bg-white/75 px-4 py-4 transition hover:border-signal/20 hover:bg-white"
              >
                Open a sample analysis page
              </Link>
              <Link
                href="/watch"
                className="rounded-2xl border border-ink/10 bg-white/75 px-4 py-4 transition hover:border-signal/20 hover:bg-white"
              >
                Open the watchlist page
              </Link>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
