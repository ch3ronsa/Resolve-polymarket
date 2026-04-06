import Link from "next/link";

import { MarketUrlForm } from "@/components/market-url-form";
import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";

const signals = [
  {
    title: "Plain-language summary",
    description:
      "Explain what the market resolves on, where the resolution guidance points, and which dates matter most."
  },
  {
    title: "Ambiguity flags",
    description:
      "Spot subjective wording, sparse rule text, missing dates, and other issues that deserve a closer read."
  },
  {
    title: "Shareable output",
    description:
      "Each market analysis lives at its own stable URL so the same summary can be shared on web and Telegram."
  }
];

const principles = [
  "No trading prompts or performance framing.",
  "Deterministic logic first, with API-backed facts from Polymarket.",
  "Storage and Telegram hooks are present, but kept intentionally lightweight."
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
                  Resolution-first market notes
                </p>
                <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
                  Paste a Polymarket URL and get a calm read on how resolution is supposed
                  to work.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate">
                  ResolveRadar turns a market page into a concise resolution brief with
                  critical dates, ambiguity flags, and a plain risk label. It is designed
                  for clarity, not hype.
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
            eyebrow="What ships in this MVP"
            title="Simple by design"
            description="The first version focuses on trustworthy summaries rather than dashboards, alerts, or trading-style UI."
          >
            <div className="space-y-4">
              {signals.map((signal) => (
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
            eyebrow="Routes"
            title="Ready pages"
            description="The initial shell exposes the homepage, a shareable analysis page, and an empty watchlist view."
          >
            <div className="grid gap-3 text-sm text-slate">
              <Link
                href="/watch"
                className="rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 transition hover:border-signal/20 hover:bg-white"
              >
                View `/watch`
              </Link>
              <Link
                href="/analyze/will-bitcoin-reach-150k-in-2026"
                className="rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 transition hover:border-signal/20 hover:bg-white"
              >
                Open a sample `/analyze/[slug]` page
              </Link>
            </div>
          </Panel>

          <Panel
            eyebrow="How it works"
            title="A narrow, deterministic pipeline"
            description="Fetch from Polymarket, normalize the market payload, score ambiguity with rules, and optionally persist the result."
          >
            <ol className="grid gap-4 text-sm text-slate sm:grid-cols-3">
              <li className="rounded-3xl border border-ink/10 bg-white/75 p-5">
                <p className="font-medium text-ink">1. Parse input</p>
                <p className="mt-2 leading-6">
                  Accept either the full Polymarket URL or a slug and normalize it into a
                  stable route.
                </p>
              </li>
              <li className="rounded-3xl border border-ink/10 bg-white/75 p-5">
                <p className="font-medium text-ink">2. Fetch facts</p>
                <p className="mt-2 leading-6">
                  Pull official market fields from the public Gamma API and expose the key
                  dates, sources, and structure.
                </p>
              </li>
              <li className="rounded-3xl border border-ink/10 bg-white/75 p-5">
                <p className="font-medium text-ink">3. Score risk</p>
                <p className="mt-2 leading-6">
                  Apply rule-based checks for ambiguity and store the resulting summary
                  when a database is configured.
                </p>
              </li>
            </ol>
          </Panel>
        </section>
      </div>
    </main>
  );
}
