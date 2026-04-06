import { env } from "@/lib/env";
import { logError, logInfo } from "@/lib/logging";
import { generatePersistedWatchlists } from "@/lib/watch/run-generated-watchlists";

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to generate watchlists.");
  }

  logInfo({
    scope: "script",
    event: "watchlists_generate_started",
    message: "Starting generated watchlist refresh."
  });

  const result = await generatePersistedWatchlists();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  logError({
    scope: "script",
    event: "watchlists_generate_failed",
    error
  });
  process.exit(1);
});
