import Link from "next/link";

import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";

export default function WatchPage() {
  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <SiteHeader />
        <div className="mt-10">
          <Panel
            eyebrow="Watchlist"
            title="No saved markets yet"
            description="Storage hooks are in place, but watchlist management and background refresh come in a later step."
          >
            <div className="rounded-[2rem] border border-dashed border-ink/15 bg-white/70 p-8 text-center">
              <p className="font-serif text-2xl text-ink">A clean slate is okay.</p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate">
                Visit an analysis page first. Once database-backed persistence is configured,
                this route can surface recent market summaries and shared records.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-medium text-ink transition hover:border-signal/20 hover:bg-mist"
              >
                Analyze a market
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

