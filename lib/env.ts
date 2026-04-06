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
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
});

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
