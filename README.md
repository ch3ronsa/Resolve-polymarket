# ResolveRadar

ResolveRadar is a deployment-ready MVP for reading Polymarket markets more carefully. It fetches official Polymarket data, runs deterministic resolution-risk checks, stores the result, renders a shareable web page, and exposes the same summary through a Telegram bot.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Zod
- grammY

## Local Setup

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npx prisma migrate deploy`.
4. Run `npm run prisma:seed`.
5. Run `npm run dev`.

Useful commands:

- `npm test`
- `npm run build`
- `npm run sync:active`
- `npm run watchlists:generate`
- `npm run sync:run`
- `npm run bot:dev`

## Env Vars

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `POLYMARKET_API_BASE_URL`: defaults to `https://gamma-api.polymarket.com`.
- `POLYMARKET_API_TIMEOUT_MS`: upstream timeout in milliseconds.
- `POLYMARKET_API_RETRY_COUNT`: retry count for Polymarket fetches.
- `POLYMARKET_COMMENTS_LIMIT`: max comments fetched per market analysis.
- `ANALYSIS_CACHE_MAX_AGE_MS`: freshness window for cached analyses.
- `WATCH_SOON_WINDOW_DAYS`: threshold for soon-to-resolve watch entries.
- `SYNC_DISCOVERY_EVENT_LIMIT`: how many events discovery inspects per run.
- `SYNC_MARKET_MAX_PER_RUN`: hard cap on markets re-analyzed in one sync cycle.
- `SYNC_MIN_VOLUME`: minimum volume threshold for discovery scoring.
- `SYNC_MIN_LIQUIDITY`: minimum liquidity threshold for discovery scoring.
- `SYNC_NEAR_RESOLUTION_HOURS`: near-resolution boost window.
- `SYNC_MIN_COMMENT_COUNT`: minimum comment count that contributes to activity scoring.
- `SYNC_MARKET_ACTIVITY_WEIGHT`: multiplier for comment activity scoring.
- `RECENT_ACTIVITY_WINDOW_HOURS`: window for recent-activity watch entries.
- `WATCHLIST_MAX_PER_KIND`: max generated entries per watch kind.
- `NEXT_PUBLIC_APP_URL`: base URL used for share links and Telegram deep links.
- `TELEGRAM_BOT_TOKEN`: bot token for polling mode.
- `TELEGRAM_BOT_MODE`: `polling` today, `webhook` reserved for later.
- `TELEGRAM_WEBHOOK_URL`: reserved for later webhook deployment.
- `TELEGRAM_WEBHOOK_SECRET`: reserved for later webhook deployment.
- `TELEGRAM_WATCH_LIMIT`: number of watch entries returned in Telegram replies.
- `CRON_SECRET`: bearer token expected by `/api/cron/sync`.

## Database Setup

- PostgreSQL, Supabase Postgres, Neon, or another Prisma-compatible Postgres host will work.
- Run `npx prisma migrate deploy` in deployed environments.
- Run `npm run prisma:seed` locally if you want demo analyses and watchlist entries.
- For Supabase-style serverless hosting, prefer the pooled transaction-mode connection string and start conservative on pool size, for example `connection_limit=1`.

## Bot Setup

1. Set `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, and `TELEGRAM_BOT_TOKEN`.
2. Keep `TELEGRAM_BOT_MODE="polling"` for local development.
3. Run `npm run bot:dev`.

Supported commands:

- `/start`
- `/help`
- `/market <url-or-slug>`
- `/watch soon`
- `/watch risky`

You can also paste a Polymarket URL directly into the bot.

## Cron Commands

Local:

- `npm run sync:run`

Vercel:

- `vercel.json` schedules `GET /api/cron/sync` every 30 minutes.
- Set `CRON_SECRET` in Vercel so the cron request includes `Authorization: Bearer <CRON_SECRET>`.

If you want to run the same logic outside Vercel, hit `/api/cron/sync` with the same bearer token or call `npm run sync:run` from your own scheduler.

## Deployment Notes

- Deploy the app to Vercel as a standard Next.js project.
- Set all required environment variables in Vercel.
- Provision Postgres first, then run Prisma migrations against that database.
- `/api/health` returns `200` only when storage is configured and reachable.
- DB-backed API routes use the Node.js runtime for Prisma compatibility.

## Fixtures And Demo Data

`prisma/fixtures/` includes seeded demo analyses for:

- a clean binary market
- a weak-source ambiguity case
- a timezone-sensitive case
- a comment-dispute case
- the original sample macro market

`npm run prisma:seed` persists all of them and refreshes generated watchlists.

## Smoke Test Checklist

1. `npm test`
2. `npm run build`
3. `GET /api/health` returns `200` after `DATABASE_URL` is configured.
4. `POST /api/analyze` with a seeded slug returns `ok: true`.
5. `GET /api/analysis/<slug>` returns the stored run.
6. `GET /api/watch?kind=risky&limit=5` returns generated entries after seeding or sync.
7. `npm run bot:dev` starts polling and `/market <slug>` returns a formatted reply.
8. `GET /api/cron/sync` succeeds with `Authorization: Bearer <CRON_SECRET>`.

## Intentionally Left Out Of MVP

- No buy/sell, alpha, edge, or trading framing
- No auth, billing, subscriptions, or user accounts
- No websockets or real-time streaming
- No alert delivery system beyond the Telegram bot request/response flow
- No LLM calls in the analysis engine
- No manual analyst review workflow or admin dashboard
- No webhook-based Telegram deployment yet
