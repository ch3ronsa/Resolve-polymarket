import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { analyzeMarket } from "@/lib/analysis/market-analysis";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import { logInfo } from "@/lib/logging";
import type { PolymarketComment, PolymarketEvent, PolymarketMarket } from "@/lib/polymarket/types";
import { generatePersistedWatchlists } from "@/lib/watch/run-generated-watchlists";

type SeedFixture = {
  sourceInput: string;
  market: PolymarketMarket;
  event?: PolymarketEvent | null;
  comments?: PolymarketComment[];
  rawMarket?: unknown;
  rawEvent?: unknown;
  rawComments?: unknown;
};

async function loadFixtures() {
  const fixtureDirectory = path.join(process.cwd(), "prisma", "fixtures");
  const files = (await readdir(fixtureDirectory))
    .filter((file) => file.endsWith(".json"))
    .sort();

  const fixtures = await Promise.all(
    files.map(async (file) => {
      const fixturePath = path.join(fixtureDirectory, file);
      const contents = await readFile(fixturePath, "utf8");
      return JSON.parse(contents) as SeedFixture;
    })
  );

  return fixtures;
}

async function main() {
  const prisma = new PrismaClient();
  const fixtures = await loadFixtures();

  try {
    for (const fixture of fixtures) {
      await prisma.watchEntry.upsert({
        where: {
          kind_slug: {
            kind: "MANUAL",
            slug: fixture.market.slug
          }
        },
        create: {
          kind: "MANUAL",
          slug: fixture.market.slug,
          sourceInput: fixture.sourceInput,
          enabled: true,
          note: "Seeded sample watch entry"
        },
        update: {
          sourceInput: fixture.sourceInput,
          enabled: true,
          note: "Seeded sample watch entry"
        }
      });

      const analysis = analyzeMarket({
        market: fixture.market,
        event: fixture.event ?? null,
        comments: fixture.comments ?? [],
        sourceInput: fixture.sourceInput
      });
      const result = await persistMarketAnalysis({
        market: fixture.market,
        rawMarket: fixture.rawMarket ?? fixture.market,
        event: fixture.event ?? null,
        rawEvent: fixture.rawEvent ?? fixture.event ?? null,
        comments: fixture.comments ?? [],
        rawComments: fixture.rawComments ?? fixture.comments ?? [],
        analysis,
        sourceInput: fixture.sourceInput,
        triggerSource: "SEED"
      });

      if (!result.persisted) {
        throw new Error(result.reason ?? `Seed persistence failed for ${fixture.market.slug}.`);
      }

      logInfo({
        scope: "seed",
        event: "fixture_seeded",
        message: `Seeded analysis for ${fixture.market.slug}.`,
        details: {
          comments: fixture.comments?.length ?? 0,
          analysisRunId: result.analysisRunId
        }
      });
    }

    await generatePersistedWatchlists();

    console.log(
      `Seeded ${fixtures.length} markets with deterministic analyses and refreshed generated watchlists.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
