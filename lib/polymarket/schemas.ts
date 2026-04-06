import { z } from "zod";

const stringOrNumberSchema = z.union([z.string(), z.number()]);
const nullableNumberSchema = z.union([z.number(), z.string()]).nullish();

export const rawEmbeddedEventSchema = z
  .object({
    id: stringOrNumberSchema.nullish(),
    slug: z.string().nullish(),
    title: z.string().nullish(),
    endDate: z.string().nullish(),
    resolutionSource: z.string().nullish(),
    category: z.string().nullish(),
    negRisk: z.boolean().nullish(),
    closed: z.boolean().nullish(),
    active: z.boolean().nullish(),
    commentsEnabled: z.boolean().nullish(),
    commentCount: z.number().nullish()
  })
  .passthrough();

export const rawPolymarketMarketSchema = z
  .object({
    id: stringOrNumberSchema,
    conditionId: z.string().nullish(),
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
    commentsEnabled: z.boolean().nullish(),
    disqusThread: z.string().nullish(),
    outcomes: z.unknown().optional(),
    outcomePrices: z.unknown().optional(),
    volume: nullableNumberSchema,
    liquidity: nullableNumberSchema,
    volumeNum: z.number().nullish().optional(),
    liquidityNum: z.number().nullish().optional(),
    events: z.array(rawEmbeddedEventSchema).optional().default([])
  })
  .passthrough();

export const rawPolymarketEventSchema = z
  .object({
    id: stringOrNumberSchema,
    ticker: z.string().nullish(),
    slug: z.string().nullish(),
    title: z.string().nullish(),
    subtitle: z.string().nullish(),
    description: z.string().nullish(),
    resolutionSource: z.string().nullish(),
    startDate: z.string().nullish(),
    creationDate: z.string().nullish(),
    endDate: z.string().nullish(),
    image: z.string().nullish(),
    icon: z.string().nullish(),
    active: z.boolean().nullish(),
    closed: z.boolean().nullish(),
    archived: z.boolean().nullish(),
    featured: z.boolean().nullish(),
    restricted: z.boolean().nullish(),
    liquidity: z.number().nullish(),
    volume: z.number().nullish(),
    openInterest: z.number().nullish(),
    category: z.string().nullish(),
    subcategory: z.string().nullish(),
    commentsEnabled: z.boolean().nullish(),
    commentCount: z.number().nullish(),
    disqusThread: z.string().nullish(),
    closedTime: z.string().nullish(),
    markets: z.array(rawPolymarketMarketSchema).optional().default([])
  })
  .passthrough();

const rawCommentProfileSchema = z
  .object({
    name: z.string().nullish(),
    pseudonym: z.string().nullish(),
    username: z.string().nullish(),
    walletAddress: z.string().nullish(),
    profileImage: z.string().nullish()
  })
  .passthrough();

export const rawPolymarketCommentSchema = z
  .object({
    id: stringOrNumberSchema,
    body: z.string().nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
    parentEntityType: z.string().nullish(),
    parentEntityID: stringOrNumberSchema.nullish(),
    parentCommentID: stringOrNumberSchema.nullish(),
    userAddress: z.string().nullish(),
    replyAddress: z.string().nullish(),
    reportCount: z.number().nullish(),
    reactionCount: z.number().nullish(),
    profile: rawCommentProfileSchema.nullish()
  })
  .passthrough();

export const polymarketEventListSchema = z.array(rawPolymarketEventSchema);
export const polymarketCommentListSchema = z.array(rawPolymarketCommentSchema);

