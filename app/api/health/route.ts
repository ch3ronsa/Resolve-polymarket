import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "ResolveRadar",
    storageConfigured: Boolean(env.DATABASE_URL),
    telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN),
    polymarketApiBaseUrl: env.POLYMARKET_API_BASE_URL
  });
}

