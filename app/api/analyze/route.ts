import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeMarket } from "@/lib/analysis/market-analysis";
import { persistMarketAnalysis } from "@/lib/db/analysis-store";
import { isPolymarketApiError } from "@/lib/polymarket/errors";
import { extractPolymarketSlug } from "@/lib/polymarket/slug";
import { getPolymarketMarketBundleBySlug } from "@/lib/polymarket/service";

const inputSchema = z.object({
  input: z.string().min(1, "A Polymarket URL or slug is required.")
});

async function analyzeInput(input: string) {
  try {
    const slug = extractPolymarketSlug(input);

    if (!slug) {
      return NextResponse.json(
        {
          error: "Enter a valid Polymarket URL or slug."
        },
        { status: 400 }
      );
    }

    const bundle = await getPolymarketMarketBundleBySlug(slug);

    if (!bundle) {
      return NextResponse.json(
        {
          error: "No market was returned for that slug.",
          slug
        },
        { status: 404 }
      );
    }

    const market = bundle.market.data;
    const analysis = analyzeMarket({
      market,
      event: bundle.event?.data ?? null,
      comments: bundle.comments.data,
      sourceInput: input
    });
    const persistence = await persistMarketAnalysis({
      market,
      rawMarket: bundle.market.raw,
      event: bundle.event?.data ?? null,
      rawEvent: bundle.event?.raw,
      comments: bundle.comments.data,
      rawComments: bundle.comments.raw,
      analysis,
      sourceInput: input,
      triggerSource: "API"
    });

    return NextResponse.json({
      slug,
      market,
      analysis,
      persistence
    });
  } catch (error) {
    if (isPolymarketApiError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          endpoint: error.endpoint,
          retryable: error.retryable,
          status: error.status
        },
        { status: error.status && error.status >= 400 ? error.status : 502 }
      );
    }

    throw error;
  }
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
