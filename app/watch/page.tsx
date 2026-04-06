import Link from "next/link";

import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";
import { listStoredMarketsWithLatestAnalysis } from "@/lib/db/analysis-read";
import { env } from "@/lib/env";
import { generateWatchEntries } from "@/lib/watch/generate-watchlist";

function WatchEntryCard({
  entry
}: {
  entry: ReturnType<typeof generateWatchEntries>[number];
}) {
  return (
    <Link
      href={`/analyze/${entry.slug}`}
      className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-5 transition hover:border-signal/20 hover:bg-white"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-ink/10 bg-mist/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate">
          {entry.kind}
        </span>
        <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate">
          {entry.riskLevel} risk
        </span>
        <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate">
          Score {entry.riskScore}
        </span>
        <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate">
          Confidence {entry.confidenceLevel}
        </span>
      </div>
      <h3 className="mt-4 font-serif text-2xl leading-tight text-ink">{entry.question}</h3>
      <p className="mt-3 text-sm leading-6 text-slate">{entry.reason}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-mist/45 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate">Latest analysis</p>
          <p className="mt-2 text-sm text-ink">{new Date(entry.analysisCreatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-mist/45 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate">Next date</p>
          <p className="mt-2 text-sm text-ink">
            {entry.nextCriticalDate ? entry.nextCriticalDate.display : "No upcoming date surfaced"}
          </p>
        </div>
      </div>
    </Link>
  );
}


function EmptyWatchSection({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-ink/15 bg-white/70 p-6">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate">{description}</p>
    </div>
  );
}

export default async function WatchPage() {
  if (!env.DATABASE_URL) {
    return (
      <main className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <SiteHeader />
          <div className="mt-10">
            <Panel
              eyebrow="Watchlist"
              title="Storage is not configured yet"
              description="The watch page relies on stored analysis runs. Add a PostgreSQL DATABASE_URL, run migrations, and analyze a few markets to populate it."
            >
              <Link
                href="/"
                className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-ink/90"
              >
                Analyze a market first
              </Link>
            </Panel>
          </div>
        </div>
      </main>
    );
  }

  const records = await listStoredMarketsWithLatestAnalysis(40);
  const riskyEntries = generateWatchEntries(records, "risky", 12);
  const soonEntries = generateWatchEntries(records, "soon", 12);

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <SiteHeader />

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel
            eyebrow="Watchlist"
            title="Markets that deserve another look"
            description="This page surfaces the latest stored analyses that either look relatively risky or have a relevant date approaching soon. It is meant for review and triage, not trading."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate">Risky now</p>
                <p className="mt-2 font-serif text-3xl text-ink">{riskyEntries.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate">Soon</p>
                <p className="mt-2 font-serif text-3xl text-ink">{soonEntries.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-ink/10 bg-white/75 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate">Stored analyses</p>
                <p className="mt-2 font-serif text-3xl text-ink">{records.length}</p>
              </div>
            </div>
          </Panel>

          <Panel
            eyebrow="How to use it"
            title="Read this page as a queue"
            description="The first section groups markets where the latest run still sees material uncertainty. The second section groups markets with approaching dates worth checking."
          >
            <div className="space-y-3 text-sm leading-6 text-slate">
              <p>What this means: a high score or unknown risk suggests more manual reading may still be needed.</p>
              <p>What is still uncertain: this list only reflects the latest stored run, not a live refresh on every page load.</p>
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel
            eyebrow="Risky"
            title="Higher-risk analyses"
            description="Markets whose latest deterministic run still carries a high score or an unknown overall risk."
          >
            <div className="space-y-4">
              {riskyEntries.length ? (
                riskyEntries.map((entry) => <WatchEntryCard key={`risky-${entry.slug}`} entry={entry} />)
              ) : (
                <EmptyWatchSection
                  title="No risky entries right now"
                  description="Analyze more markets or refresh existing ones to build out this queue."
                />
              )}
            </div>
          </Panel>

          <Panel
            eyebrow="Soon"
            title="Approaching dates"
            description={`Markets whose next surfaced critical date falls within the next ${env.WATCH_SOON_WINDOW_DAYS} days.`}
          >
            <div className="space-y-4">
              {soonEntries.length ? (
                soonEntries.map((entry) => <WatchEntryCard key={`soon-${entry.slug}`} entry={entry} />)
              ) : (
                <EmptyWatchSection
                  title="No near-term dates detected"
                  description="Once stored analyses expose upcoming critical dates, they will appear here."
                />
              )}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
