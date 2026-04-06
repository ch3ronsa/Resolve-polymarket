import { listStoredMarketsWithLatestAnalysis } from "@/lib/db/analysis-read";
import { env } from "@/lib/env";
import { generateWatchEntries, type GeneratedWatchKind } from "@/lib/watch/generate-watchlist";
import { persistGeneratedWatchEntries } from "@/lib/watch/store";

const generatedKinds: GeneratedWatchKind[] = [
  "soon_resolution",
  "high_risk",
  "recent_activity"
];

export async function generatePersistedWatchlists() {
  const records = await listStoredMarketsWithLatestAnalysis(env.WATCHLIST_MAX_PER_KIND * 6);
  const results: Record<GeneratedWatchKind, number> = {
    soon_resolution: 0,
    high_risk: 0,
    recent_activity: 0
  };

  for (const kind of generatedKinds) {
    const entries = generateWatchEntries(records, kind, env.WATCHLIST_MAX_PER_KIND);
    const persisted = await persistGeneratedWatchEntries(kind, entries);
    results[kind] = persisted.persisted ? entries.length : 0;
  }

  return {
    totalMarketsConsidered: records.length,
    watchlists: results
  };
}

