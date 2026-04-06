import { env } from "@/lib/env";
import { fetchPolymarketJson } from "@/lib/polymarket/http";
import {
  parsePolymarketComments,
  parsePolymarketEvents,
  parsePolymarketMarket,
  type PolymarketComment,
  type PolymarketEvent,
  type PolymarketMarket
} from "@/lib/polymarket/types";

export type PolymarketResource<T> = {
  data: T;
  raw: unknown;
};

export type ListPolymarketEventsParams = {
  slug?: string[];
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
};

export type ListPolymarketCommentsParams = {
  parentEntityType: "market" | "event" | "series";
  parentEntityId: string;
  limit?: number;
  offset?: number;
};

function withOptionalArray(searchParams: URLSearchParams, key: string, values?: string[]) {
  values?.filter(Boolean).forEach((value) => {
    searchParams.append(key, value);
  });
}

export async function getPolymarketMarketResourceBySlug(
  slug: string
): Promise<PolymarketResource<PolymarketMarket> | null> {
  return fetchPolymarketJson({
    path: `/markets/slug/${encodeURIComponent(slug)}`,
    parse: parsePolymarketMarket,
    allowNotFound: true,
    cacheTag: `market:${slug}`
  });
}

export async function getPolymarketMarketBySlug(slug: string) {
  const resource = await getPolymarketMarketResourceBySlug(slug);
  return resource?.data ?? null;
}

export async function listPolymarketEventResources(
  params: ListPolymarketEventsParams = {}
): Promise<PolymarketResource<PolymarketEvent[]> | null> {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  if (params.active !== undefined) {
    searchParams.set("active", String(params.active));
  }

  if (params.closed !== undefined) {
    searchParams.set("closed", String(params.closed));
  }

  withOptionalArray(searchParams, "slug", params.slug);

  return fetchPolymarketJson({
    path: "/events",
    searchParams,
    parse: parsePolymarketEvents,
    cacheTag: "events:list"
  });
}

export async function listPolymarketEvents(params: ListPolymarketEventsParams = {}) {
  const resource = await listPolymarketEventResources(params);
  return resource?.data ?? [];
}

export async function listPolymarketCommentResources(
  params: ListPolymarketCommentsParams
): Promise<PolymarketResource<PolymarketComment[]> | null> {
  const searchParams = new URLSearchParams({
    parentEntityType: params.parentEntityType,
    parentEntityID: params.parentEntityId
  });

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  return fetchPolymarketJson({
    path: "/comments",
    searchParams,
    parse: parsePolymarketComments,
    cacheTag: `comments:${params.parentEntityType}:${params.parentEntityId}`
  });
}

export async function listPolymarketComments(params: ListPolymarketCommentsParams) {
  const resource = await listPolymarketCommentResources(params);
  return resource?.data ?? [];
}

export async function getPrimaryPolymarketEventResource(slug: string) {
  const resource = await listPolymarketEventResources({
    slug: [slug],
    limit: 1
  });

  if (!resource) {
    return null;
  }

  return {
    data: resource.data[0] ?? null,
    raw: Array.isArray(resource.raw) ? resource.raw[0] ?? null : resource.raw
  };
}

export async function getPrimaryPolymarketEvent(slug: string) {
  const resource = await getPrimaryPolymarketEventResource(slug);
  return resource?.data ?? null;
}

export async function getPolymarketCommentResourcesForMarket(marketId: string) {
  return listPolymarketCommentResources({
    parentEntityType: "market",
    parentEntityId: marketId,
    limit: env.POLYMARKET_COMMENTS_LIMIT
  });
}

export async function getPolymarketCommentsForMarket(marketId: string) {
  const resource = await getPolymarketCommentResourcesForMarket(marketId);
  return resource?.data ?? [];
}
