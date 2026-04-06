import {
  getPolymarketCommentResourcesForMarket,
  getPolymarketMarketResourceBySlug,
  getPrimaryPolymarketEventResource
} from "@/lib/polymarket/client";

export type PolymarketMarketBundle = {
  market: {
    data: NonNullable<Awaited<ReturnType<typeof getPolymarketMarketResourceBySlug>>>["data"];
    raw: NonNullable<Awaited<ReturnType<typeof getPolymarketMarketResourceBySlug>>>["raw"];
  };
  event: {
    data: NonNullable<Awaited<ReturnType<typeof getPrimaryPolymarketEventResource>>>["data"];
    raw: NonNullable<Awaited<ReturnType<typeof getPrimaryPolymarketEventResource>>>["raw"];
  } | null;
  comments: {
    data: NonNullable<Awaited<ReturnType<typeof getPolymarketCommentResourcesForMarket>>>["data"];
    raw: NonNullable<Awaited<ReturnType<typeof getPolymarketCommentResourcesForMarket>>>["raw"];
  };
};

function canFetchMarketComments(marketId: string) {
  return /^\d+$/.test(marketId);
}

export async function getPolymarketMarketBundleBySlug(slug: string): Promise<PolymarketMarketBundle | null> {
  const marketResource = await getPolymarketMarketResourceBySlug(slug);

  if (!marketResource) {
    return null;
  }

  const eventSlug = marketResource.data.events.find((event) => event.slug)?.slug ?? null;

  const [eventResource, commentResource] = await Promise.all([
    eventSlug ? getPrimaryPolymarketEventResource(eventSlug) : Promise.resolve(null),
    marketResource.data.commentsEnabled !== false && canFetchMarketComments(marketResource.data.id)
      ? getPolymarketCommentResourcesForMarket(marketResource.data.id)
      : Promise.resolve(null)
  ]);

  return {
    market: marketResource,
    event: eventResource,
    comments: commentResource ?? {
      data: [],
      raw: []
    }
  };
}
