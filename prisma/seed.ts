import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { analyzeMarket } from "@/lib/analysis/market-analysis";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import type { PolymarketComment, PolymarketEvent, PolymarketMarket } from "@/lib/polymarket/types";

type SeedFixture = {
  sourceInput: string;
  market: PolymarketMarket;
  event?: PolymarketEvent | null;
  comments?: PolymarketComment[];
  rawMarket?: unknown;
  rawEvent?: unknown;
  rawComments?: unknown;
};

async function loadFixture() {
  const fixturePath = path.join(process.cwd(), "prisma", "fixtures", "sample-market-bundle.json");
  const file = await readFile(fixturePath, "utf8");
  return JSON.parse(file) as SeedFixture;
}

async function main() {
  const prisma = new PrismaClient();
  const fixture = await loadFixture();

  try {
    await prisma.watchEntry.upsert({
      where: {
        slug: fixture.market.slug
      },
      create: {
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

    const analysis = analyzeMarket(fixture.market);
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
      throw new Error(result.reason ?? "Seed persistence failed.");
    }

    console.log(
      `Seeded market ${fixture.market.slug} with ${fixture.comments?.length ?? 0} comments and analysis run ${result.analysisRunId}.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

