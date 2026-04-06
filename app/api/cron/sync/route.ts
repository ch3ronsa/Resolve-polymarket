import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { logError, logInfo, logWarn } from "@/lib/logging";
import { syncActiveMarkets } from "@/lib/sync/sync-active-markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  if (!env.CRON_SECRET) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  const requestId = randomUUID();

  if (!env.CRON_SECRET) {
    logWarn({
      scope: "cron",
      event: "sync_config_missing",
      requestId,
      message: "Cron secret is not configured."
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CRON_SECRET_MISSING",
          message: "CRON_SECRET must be configured for cron execution.",
          requestId
        }
      },
      { status: 503 }
    );
  }

  if (!isAuthorized(request)) {
    logWarn({
      scope: "cron",
      event: "sync_unauthorized",
      requestId,
      message: "Cron sync request was rejected due to invalid authorization."
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized cron request.",
          requestId
        }
      },
      { status: 401 }
    );
  }

  if (!env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: "DATABASE_URL must be configured for the sync job.",
          requestId
        }
      },
      { status: 503 }
    );
  }

  try {
    logInfo({
      scope: "cron",
      event: "sync_started",
      requestId,
      message: "Starting active market sync cycle."
    });

    const result = await syncActiveMarkets({
      generateWatchlists: true
    });

    logInfo({
      scope: "cron",
      event: "sync_completed",
      requestId,
      message: "Active market sync cycle completed.",
      details: {
        syncedCount: result.syncedCount,
        candidateCount: result.candidateCount
      }
    });

    return NextResponse.json(
      {
        ok: true,
        data: result,
        trace: {
          requestId,
          generatedAt: new Date().toISOString()
        }
      },
      { status: 200 }
    );
  } catch (error) {
    logError({
      scope: "cron",
      event: "sync_failed",
      requestId,
      error
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SYNC_FAILED",
          message: "ResolveRadar could not complete the sync cycle.",
          requestId
        }
      },
      { status: 500 }
    );
  }
}
