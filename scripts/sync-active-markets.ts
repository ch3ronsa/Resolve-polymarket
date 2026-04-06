import { env } from "@/lib/env";
import { syncActiveMarkets } from "@/lib/sync/sync-active-markets";

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run syncActiveMarkets.");
  }

  const result = await syncActiveMarkets({
    generateWatchlists: true
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

