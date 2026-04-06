import { z } from "zod";

const rawEventSchema = z
  .object({
    slug: z.string().nullish(),
    title: z.string().nullish(),
    endDate: z.string().nullish(),
    resolutionSource: z.string().nullish(),
    category: z.string().nullish(),
    negRisk: z.boolean().nullish(),
    closed: z.boolean().nullish(),
    active: z.boolean().nullish()
  })
  .passthrough();

const rawMarketSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    slug: z.string(),
    question: z.string(),
    description: z.string().nullish(),
    resolutionSource: z.string().nullish(),
    endDate: z.string().nullish(),
    startDate: z.string().nullish(),
    umaEndDate: z.string().nullish(),
    closedTime: z.string().nullish(),
    lowerBound: z.string().nullish(),
    upperBound: z.string().nullish(),
    lowerBoundDate: z.string().nullish(),
    upperBoundDate: z.string().nullish(),
    category: z.string().nullish(),
    active: z.boolean().optional().default(false),
    closed: z.boolean().optional().default(false),
    marketType: z.string().nullish(),
    formatType: z.string().nullish(),
    hasReviewedDates: z.boolean().nullish(),
    outcomes: z.unknown().optional(),
    outcomePrices: z.unknown().optional(),
    volume: z.union([z.string(), z.number()]).nullish(),
    liquidity: z.union([z.string(), z.number()]).nullish(),
    volumeNum: z.number().nullish().optional(),
    liquidityNum: z.number().nullish().optional(),
    events: z.array(rawEventSchema).optional().default([])
  })
  .passthrough();

export type PolymarketEvent = {
  slug: string | null;
  title: string | null;
  endDate: string | null;
  resolutionSource: string | null;
  category: string | null;
  negRisk: boolean;
  closed: boolean;
  active: boolean;
};

export type PolymarketMarket = {
  id: string;
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
  outcomes: string[];
  outcomePrices: number[];
  volume: number | null;
  liquidity: number | null;
  events: PolymarketEvent[];
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
  const raw = rawMarketSchema.parse(payload);

  return {
    id: String(raw.id),
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
    outcomes: coerceStringArray(raw.outcomes),
    outcomePrices: coerceNumberArray(raw.outcomePrices),
    volume: raw.volumeNum ?? coerceNumber(raw.volume),
    liquidity: raw.liquidityNum ?? coerceNumber(raw.liquidity),
    events: raw.events.map((event) => ({
      slug: event.slug ?? null,
      title: event.title ?? null,
      endDate: event.endDate ?? null,
      resolutionSource: event.resolutionSource ?? null,
      category: event.category ?? null,
      negRisk: Boolean(event.negRisk),
      closed: Boolean(event.closed),
      active: Boolean(event.active)
    }))
  };
}

