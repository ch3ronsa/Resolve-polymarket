import type { Metadata } from "next";
import Link from "next/link";

import { AnalysisView, EmptyAnalysisState } from "@/components/analysis-view";
import { Panel } from "@/components/panel";
import { SiteHeader } from "@/components/site-header";
import { analyzeMarket } from "@/lib/analysis/market-analysis";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import { normalizeSlug } from "@/lib/polymarket/slug";
import { getPolymarketMarketBundleBySlug } from "@/lib/polymarket/service";

type AnalyzePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: AnalyzePageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `ResolveRadar | ${slug}`,
    description: `Resolution summary and ambiguity flags for the Polymarket market "${slug}".`
  };
}

export default async function AnalyzePage({ params }: AnalyzePageProps) {
  const { slug: slugParam } = await params;
  const slug = normalizeSlug(slugParam);

  if (!slug) {
    return (
      <main className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <SiteHeader />
          <div className="mt-10">
            <EmptyAnalysisState
              title="That market slug does not look valid"
              description="Paste a standard Polymarket event URL or slug to generate an analysis page."
            />
          </div>
        </div>
      </main>
    );
  }

  const bundle = await getPolymarketMarketBundleBySlug(slug);

  if (!bundle) {
    return (
      <main className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <SiteHeader />
          <div className="mt-10">
            <EmptyAnalysisState
              title="No market was returned for this slug"
              description="ResolveRadar could not find a matching Polymarket market. Double-check the slug or try the full event URL."
            />
          </div>
        </div>
      </main>
    );
  }

  const market = bundle.market.data;
  const analysis = analyzeMarket({
    market,
    event: bundle.event?.data ?? null,
    comments: bundle.comments.data,
    sourceInput: slug
  });
  const persistence = await persistMarketAnalysis({
    market,
    rawMarket: bundle.market.raw,
    event: bundle.event?.data ?? null,
    rawEvent: bundle.event?.raw,
    comments: bundle.comments.data,
    rawComments: bundle.comments.raw,
    analysis,
    sourceInput: slug,
    triggerSource: "WEB"
  });

  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <SiteHeader />
        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate">
          <Link
            href="/"
            className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 transition hover:border-signal/20 hover:bg-white"
          >
            New analysis
          </Link>
          <Link
            href={`https://polymarket.com/event/${market.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 transition hover:border-signal/20 hover:bg-white"
          >
            Open on Polymarket
          </Link>
        </div>
        <div className="mt-6">
          <AnalysisView
            market={market}
            analysis={analysis}
            persisted={persistence.persisted}
            persistenceReason={persistence.reason}
            analysisRunId={persistence.analysisRunId}
            rawMetadata={{
              market: bundle.market.raw,
              event: bundle.event?.raw,
              comments: bundle.comments.raw
            }}
          />
        </div>
        <div className="mt-6">
          <Panel
            eyebrow="Storage note"
            title="Persistence is optional in local development"
            description="This page already attempts to save a normalized analysis result. If a PostgreSQL database is not configured yet, the web view still works and shows the live API-backed summary."
          />
        </div>
      </div>
    </main>
  );
}
