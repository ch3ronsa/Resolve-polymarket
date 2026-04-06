import { env } from "@/lib/env";
import { logError, logInfo } from "@/lib/logging";
import { syncActiveMarkets } from "@/lib/sync/sync-active-markets";

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run syncActiveMarkets.");
  }

  logInfo({
    scope: "script",
    event: "sync_active_markets_started",
    message: "Starting syncActiveMarkets script."
  });

  const result = await syncActiveMarkets({
    generateWatchlists: true
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  logError({
    scope: "script",
    event: "sync_active_markets_failed",
    error
  });
  process.exit(1);
});
