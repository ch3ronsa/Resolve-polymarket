import { env } from "@/lib/env";
import { logError, logInfo } from "@/lib/logging";
import { syncActiveMarkets } from "@/lib/sync/sync-active-markets";

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run the sync cycle.");
  }

  logInfo({
    scope: "script",
    event: "sync_cycle_started",
    message: "Starting full sync cycle."
  });

  const result = await syncActiveMarkets({
    generateWatchlists: true
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  logError({
    scope: "script",
    event: "sync_cycle_failed",
    error
  });
  process.exit(1);
});
