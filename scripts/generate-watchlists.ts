import { env } from "@/lib/env";
import { generatePersistedWatchlists } from "@/lib/watch/run-generated-watchlists";

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to generate watchlists.");
  }

  const result = await generatePersistedWatchlists();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

