import { env } from "@/lib/env";
import { parsePolymarketMarket } from "@/lib/polymarket/types";

export async function getPolymarketMarketBySlug(slug: string) {
  const url = new URL(`/markets/slug/${encodeURIComponent(slug)}`, env.POLYMARKET_API_BASE_URL);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    },
    next: {
      revalidate: 300,
      tags: [`market:${slug}`]
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Polymarket request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return parsePolymarketMarket(payload);
}

