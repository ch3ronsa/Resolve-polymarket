"use client";

import { useEffect } from "react";

import { EmptyAnalysisState } from "@/components/analysis-view";
import { SiteHeader } from "@/components/site-header";

export default function AnalyzeError({
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
          <EmptyAnalysisState
            title="The analysis could not be completed"
            description="ResolveRadar could not fetch or process this market right now."
            action={
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-ink/90"
              >
                Retry analysis
              </button>
            }
          />
        </div>
      </div>
    </main>
  );
}

