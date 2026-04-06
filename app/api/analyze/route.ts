import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeMarket } from "@/lib/analysis/market-analysis";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import { getPolymarketMarketBySlug } from "@/lib/polymarket/client";
import { extractPolymarketSlug } from "@/lib/polymarket/slug";

const inputSchema = z.object({
  input: z.string().min(1, "A Polymarket URL or slug is required.")
});

async function analyzeInput(input: string) {
  const slug = extractPolymarketSlug(input);

  if (!slug) {
    return NextResponse.json(
      {
        error: "Enter a valid Polymarket URL or slug."
      },
      { status: 400 }
    );
  }

  const market = await getPolymarketMarketBySlug(slug);

  if (!market) {
    return NextResponse.json(
      {
        error: "No market was returned for that slug.",
        slug
      },
      { status: 404 }
    );
  }

  const analysis = analyzeMarket(market);
  const persistence = await persistMarketAnalysis({ market, analysis });

  return NextResponse.json({
    slug,
    market,
    analysis,
    persistence
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = inputSchema.safeParse({
    input: url.searchParams.get("input") ?? ""
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten().fieldErrors.input?.[0] ?? "Invalid request."
      },
      { status: 400 }
    );
  }

  return analyzeInput(parsed.data.input);
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten().fieldErrors.input?.[0] ?? "Invalid request body."
      },
      { status: 400 }
    );
  }

  return analyzeInput(parsed.data.input);
}

