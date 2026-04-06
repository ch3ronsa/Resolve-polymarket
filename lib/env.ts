import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  POLYMARKET_API_BASE_URL: z.preprocess(
    (value) => emptyToUndefined(value) ?? "https://gamma-api.polymarket.com",
    z.string().url()
  ),
  POLYMARKET_API_TIMEOUT_MS: z.preprocess(
    (value) => emptyToUndefined(value) ?? "8000",
    z.coerce.number().int().positive()
  ),
  POLYMARKET_API_RETRY_COUNT: z.preprocess(
    (value) => emptyToUndefined(value) ?? "2",
    z.coerce.number().int().min(0).max(5)
  ),
  POLYMARKET_COMMENTS_LIMIT: z.preprocess(
    (value) => emptyToUndefined(value) ?? "20",
    z.coerce.number().int().min(1).max(100)
  ),
  ANALYSIS_CACHE_MAX_AGE_MS: z.preprocess(
    (value) => emptyToUndefined(value) ?? "1800000",
    z.coerce.number().int().positive()
  ),
  WATCH_SOON_WINDOW_DAYS: z.preprocess(
    (value) => emptyToUndefined(value) ?? "7",
    z.coerce.number().int().min(1).max(90)
  ),
  SYNC_DISCOVERY_EVENT_LIMIT: z.preprocess(
    (value) => emptyToUndefined(value) ?? "60",
    z.coerce.number().int().min(1).max(250)
  ),
  SYNC_MARKET_MAX_PER_RUN: z.preprocess(
    (value) => emptyToUndefined(value) ?? "24",
    z.coerce.number().int().min(1).max(200)
  ),
  SYNC_MIN_VOLUME: z.preprocess(
    (value) => emptyToUndefined(value) ?? "25000",
    z.coerce.number().nonnegative()
  ),
  SYNC_MIN_LIQUIDITY: z.preprocess(
    (value) => emptyToUndefined(value) ?? "10000",
    z.coerce.number().nonnegative()
  ),
  SYNC_NEAR_RESOLUTION_HOURS: z.preprocess(
    (value) => emptyToUndefined(value) ?? "96",
    z.coerce.number().int().min(1).max(720)
  ),
  SYNC_MIN_COMMENT_COUNT: z.preprocess(
    (value) => emptyToUndefined(value) ?? "2",
    z.coerce.number().int().min(0).max(1000)
  ),
  SYNC_MARKET_ACTIVITY_WEIGHT: z.preprocess(
    (value) => emptyToUndefined(value) ?? "1.2",
    z.coerce.number().min(0).max(10)
  ),
  RECENT_ACTIVITY_WINDOW_HOURS: z.preprocess(
    (value) => emptyToUndefined(value) ?? "36",
    z.coerce.number().int().min(1).max(720)
  ),
  WATCHLIST_MAX_PER_KIND: z.preprocess(
    (value) => emptyToUndefined(value) ?? "20",
    z.coerce.number().int().min(1).max(100)
  ),
  NEXT_PUBLIC_APP_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  TELEGRAM_BOT_TOKEN: z.preprocess(emptyToUndefined, z.string().min(1).optional())
});

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  POLYMARKET_API_BASE_URL: process.env.POLYMARKET_API_BASE_URL,
  POLYMARKET_API_TIMEOUT_MS: process.env.POLYMARKET_API_TIMEOUT_MS,
  POLYMARKET_API_RETRY_COUNT: process.env.POLYMARKET_API_RETRY_COUNT,
  POLYMARKET_COMMENTS_LIMIT: process.env.POLYMARKET_COMMENTS_LIMIT,
  ANALYSIS_CACHE_MAX_AGE_MS: process.env.ANALYSIS_CACHE_MAX_AGE_MS,
  WATCH_SOON_WINDOW_DAYS: process.env.WATCH_SOON_WINDOW_DAYS,
  SYNC_DISCOVERY_EVENT_LIMIT: process.env.SYNC_DISCOVERY_EVENT_LIMIT,
  SYNC_MARKET_MAX_PER_RUN: process.env.SYNC_MARKET_MAX_PER_RUN,
  SYNC_MIN_VOLUME: process.env.SYNC_MIN_VOLUME,
  SYNC_MIN_LIQUIDITY: process.env.SYNC_MIN_LIQUIDITY,
  SYNC_NEAR_RESOLUTION_HOURS: process.env.SYNC_NEAR_RESOLUTION_HOURS,
  SYNC_MIN_COMMENT_COUNT: process.env.SYNC_MIN_COMMENT_COUNT,
  SYNC_MARKET_ACTIVITY_WEIGHT: process.env.SYNC_MARKET_ACTIVITY_WEIGHT,
  RECENT_ACTIVITY_WINDOW_HOURS: process.env.RECENT_ACTIVITY_WINDOW_HOURS,
  WATCHLIST_MAX_PER_KIND: process.env.WATCHLIST_MAX_PER_KIND,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
});

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
