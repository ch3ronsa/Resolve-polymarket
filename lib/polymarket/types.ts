import {
  polymarketCommentListSchema,
  polymarketEventListSchema,
  rawPolymarketMarketSchema
} from "@/lib/polymarket/schemas";

export type PolymarketEmbeddedEvent = {
  id: string | null;
  slug: string | null;
  title: string | null;
  endDate: string | null;
  resolutionSource: string | null;
  category: string | null;
  negRisk: boolean;
  closed: boolean;
  active: boolean;
  commentsEnabled: boolean | null;
  commentCount: number | null;
};

export type PolymarketEventMarket = {
  id: string;
  slug: string;
  question: string;
  endDate: string | null;
  active: boolean;
  closed: boolean;
  marketType: string | null;
  formatType: string | null;
  commentsEnabled: boolean | null;
  volume: number | null;
  liquidity: number | null;
};

export type PolymarketMarket = {
  id: string;
  conditionId: string | null;
  slug: string;
  question: string;
  description: string | null;
  resolutionSource: string | null;
  endDate: string | null;
  startDate: string | null;
  umaEndDate: string | null;
  closedTime: string | null;
  lowerBound: string | null;
  upperBound: string | null;
  lowerBoundDate: string | null;
  upperBoundDate: string | null;
  category: string | null;
  active: boolean;
  closed: boolean;
  marketType: string | null;
  formatType: string | null;
  hasReviewedDates: boolean | null;
  commentsEnabled: boolean | null;
  disqusThread: string | null;
  outcomes: string[];
  outcomePrices: number[];
  volume: number | null;
  liquidity: number | null;
  events: PolymarketEmbeddedEvent[];
};

export type PolymarketEvent = {
  id: string;
  ticker: string | null;
  slug: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  resolutionSource: string | null;
  startDate: string | null;
  creationDate: string | null;
  endDate: string | null;
  image: string | null;
  icon: string | null;
  active: boolean | null;
  closed: boolean | null;
  archived: boolean | null;
  featured: boolean | null;
  restricted: boolean | null;
  liquidity: number | null;
  volume: number | null;
  openInterest: number | null;
  category: string | null;
  subcategory: string | null;
  commentsEnabled: boolean | null;
  commentCount: number | null;
  disqusThread: string | null;
  closedTime: string | null;
  markets: PolymarketEventMarket[];
};

export type PolymarketComment = {
  id: string;
  body: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  parentEntityType: string | null;
  parentEntityId: string | null;
  parentCommentId: string | null;
  userAddress: string | null;
  replyAddress: string | null;
  reportCount: number | null;
  reactionCount: number | null;
  profileName: string | null;
  profileHandle: string | null;
  profileImage: string | null;
  profileWalletAddress: string | null;
};

function coerceStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return coerceStringArray(parsed);
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function coerceNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function coerceNumberArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(coerceNumber).filter((item): item is number => item !== null);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return coerceNumberArray(parsed);
    } catch {
      return trimmed
        .split(",")
        .map((item) => coerceNumber(item.trim()))
        .filter((item): item is number => item !== null);
    }
  }

  return [];
}

export function parsePolymarketMarket(payload: unknown): PolymarketMarket {
  const raw = rawPolymarketMarketSchema.parse(payload);

  return {
    id: String(raw.id),
    conditionId: raw.conditionId ?? null,
    slug: raw.slug,
    question: raw.question,
    description: raw.description ?? null,
    resolutionSource: raw.resolutionSource ?? null,
    endDate: raw.endDate ?? null,
    startDate: raw.startDate ?? null,
    umaEndDate: raw.umaEndDate ?? null,
    closedTime: raw.closedTime ?? null,
    lowerBound: raw.lowerBound ?? null,
    upperBound: raw.upperBound ?? null,
    lowerBoundDate: raw.lowerBoundDate ?? null,
    upperBoundDate: raw.upperBoundDate ?? null,
    category: raw.category ?? null,
    active: raw.active,
    closed: raw.closed,
    marketType: raw.marketType ?? null,
    formatType: raw.formatType ?? null,
    hasReviewedDates: raw.hasReviewedDates ?? null,
    commentsEnabled: raw.commentsEnabled ?? null,
    disqusThread: raw.disqusThread ?? null,
    outcomes: coerceStringArray(raw.outcomes),
    outcomePrices: coerceNumberArray(raw.outcomePrices),
    volume: raw.volumeNum ?? coerceNumber(raw.volume),
    liquidity: raw.liquidityNum ?? coerceNumber(raw.liquidity),
    events: raw.events.map((event) => ({
      id: event.id ? String(event.id) : null,
      slug: event.slug ?? null,
      title: event.title ?? null,
      endDate: event.endDate ?? null,
      resolutionSource: event.resolutionSource ?? null,
      category: event.category ?? null,
      negRisk: Boolean(event.negRisk),
      closed: Boolean(event.closed),
      active: Boolean(event.active),
      commentsEnabled: event.commentsEnabled ?? null,
      commentCount: event.commentCount ?? null
    }))
  };
}

export function parsePolymarketEvents(payload: unknown): PolymarketEvent[] {
  return polymarketEventListSchema.parse(payload).map((event) => ({
    id: String(event.id),
    ticker: event.ticker ?? null,
    slug: event.slug ?? null,
    title: event.title ?? null,
    subtitle: event.subtitle ?? null,
    description: event.description ?? null,
    resolutionSource: event.resolutionSource ?? null,
    startDate: event.startDate ?? null,
    creationDate: event.creationDate ?? null,
    endDate: event.endDate ?? null,
    image: event.image ?? null,
    icon: event.icon ?? null,
    active: event.active ?? null,
    closed: event.closed ?? null,
    archived: event.archived ?? null,
    featured: event.featured ?? null,
    restricted: event.restricted ?? null,
    liquidity: event.liquidity ?? null,
    volume: event.volume ?? null,
    openInterest: event.openInterest ?? null,
    category: event.category ?? null,
    subcategory: event.subcategory ?? null,
    commentsEnabled: event.commentsEnabled ?? null,
    commentCount: event.commentCount ?? null,
    disqusThread: event.disqusThread ?? null,
    closedTime: event.closedTime ?? null,
    markets: event.markets.map((market) => ({
      id: String(market.id),
      slug: market.slug,
      question: market.question,
      endDate: market.endDate ?? null,
      active: market.active,
      closed: market.closed,
      marketType: market.marketType ?? null,
      formatType: market.formatType ?? null,
      commentsEnabled: market.commentsEnabled ?? null,
      volume: market.volumeNum ?? coerceNumber(market.volume),
      liquidity: market.liquidityNum ?? coerceNumber(market.liquidity)
    }))
  }));
}

export function parsePolymarketComments(payload: unknown): PolymarketComment[] {
  return polymarketCommentListSchema.parse(payload).map((comment) => ({
    id: String(comment.id),
    body: comment.body ?? null,
    createdAt: comment.createdAt ?? null,
    updatedAt: comment.updatedAt ?? null,
    parentEntityType: comment.parentEntityType ?? null,
    parentEntityId: comment.parentEntityID ? String(comment.parentEntityID) : null,
    parentCommentId: comment.parentCommentID ? String(comment.parentCommentID) : null,
    userAddress: comment.userAddress ?? null,
    replyAddress: comment.replyAddress ?? null,
    reportCount: comment.reportCount ?? null,
    reactionCount: comment.reactionCount ?? null,
    profileName: comment.profile?.name ?? comment.profile?.pseudonym ?? null,
    profileHandle: comment.profile?.username ?? null,
    profileImage: comment.profile?.profileImage ?? null,
    profileWalletAddress: comment.profile?.walletAddress ?? null
  }));
}
