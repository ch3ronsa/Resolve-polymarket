import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { logApiError } from "@/lib/api/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = randomUUID();
  const prisma = getPrismaClient();
  let databaseReachable = false;

  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseReachable = true;
    } catch (error) {
      logApiError("/api/health", requestId, error);
    }
  }

  const storageConfigured = Boolean(env.DATABASE_URL);
  const ok = storageConfigured && (!prisma || databaseReachable);

  return NextResponse.json({
    ok,
    app: "ResolveRadar",
    environment: env.NODE_ENV,
    checks: {
      storageConfigured,
      databaseReachable,
      telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN),
      cronConfigured: Boolean(env.CRON_SECRET),
      polymarketApiBaseUrl: env.POLYMARKET_API_BASE_URL
    },
    timestamp: new Date().toISOString()
  }, { status: ok ? 200 : 503 });
}
