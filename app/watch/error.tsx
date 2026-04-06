"use client";

import { useEffect } from "react";

import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";

export default function WatchError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <SiteHeader />
        <div className="mt-10">
          <Panel
            eyebrow="Watchlist unavailable"
            title="The watch page could not be loaded"
            description="ResolveRadar hit an unexpected issue while building the watchlist view."
          >
            <p className="rounded-3xl border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error.message || "An unknown error occurred."}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-ink/90"
            >
              Try again
            </button>
          </Panel>
        </div>
      </div>
    </main>
  );
}
