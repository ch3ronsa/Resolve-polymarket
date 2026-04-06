"use client";

import { useEffect } from "react";

import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";

export default function RootError({
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
      <div className="mx-auto max-w-4xl">
        <SiteHeader />
        <div className="mt-10">
          <Panel
            eyebrow="Unexpected error"
            title="ResolveRadar could not finish this request."
            description="The app shell is in place, but this page hit an unexpected runtime issue."
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

