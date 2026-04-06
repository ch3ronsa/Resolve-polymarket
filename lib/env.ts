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
  NEXT_PUBLIC_APP_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  TELEGRAM_BOT_TOKEN: z.preprocess(emptyToUndefined, z.string().min(1).optional())
});

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  POLYMARKET_API_BASE_URL: process.env.POLYMARKET_API_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
});

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;

