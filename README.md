# ResolveRadar

ResolveRadar is a simple MVP shell for resolution-focused Polymarket analysis. A user can paste a market URL or slug, fetch the official market payload from Polymarket's public Gamma API, and receive a deterministic summary with critical dates, ambiguity flags, and a plain risk label.

## Stack

- Next.js 15 with the App Router
- TypeScript
- Tailwind CSS
- Prisma with PostgreSQL
- Zod for input and env validation
- grammY for the Telegram bot

## Data layer

- `extractPolymarketSlug(input)` accepts both raw slugs and full `polymarket.com/event/...` URLs.
- Typed Polymarket clients cover:
  - `GET /markets/slug/{slug}`
  - `GET /events`
  - `GET /comments`
- Upstream responses are validated with Zod and fetched through a timeout/retry/backoff wrapper.
- Persistence stores normalized fields and raw upstream JSON for markets, comments, and analysis runs.

## Analysis engine

- The MVP uses a deterministic engine only. No OpenAI or other LLM calls are wired in yet.
- The analysis contract is versioned and persisted per run so a future LLM-backed engine can sit behind a feature flag without changing the route contract.
- Current outputs include summary text, resolution-source summary, critical-date summary, timezone notes, ambiguity flags, comment signals, evidence items, risk score, risk level, and confidence level.

## Routes

- `/` homepage with Polymarket URL paste form
- `/analyze/[slug]` shareable analysis page
- `/watch` empty watchlist placeholder
- `/api/analyze` JSON analysis endpoint
- `/api/analysis/[slug]` latest stored analysis endpoint
- `/api/watch` generated watchlist endpoint
- `/api/health` configuration health endpoint

## Telegram bot

- `/start` introduces the bot and the non-advisory positioning.
- `/help` shows the command set.
- `/market <url-or-slug>` runs the stored deterministic analysis flow.
- `/watch soon` and `/watch risky` return the latest generated watchlists.
- Pasting a full `polymarket.com/event/...` URL into Telegram triggers analysis automatically.

The bot is structured around `createTelegramBot()` in `lib/telegram/bot.ts`, so a future webhook route can reuse the same handlers without rewriting command logic. The local script only starts long polling.

## Local development

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npm run dev`.

If you want persistence, point `DATABASE_URL` at PostgreSQL and run:

1. `npx prisma migrate dev --name init`
2. `npm run dev`

Helpful commands:

- `npx prisma migrate deploy`
- `npm run prisma:seed`
- `npm run sync:active`
- `npm run watchlists:generate`
- `npm run sync:run`
- `npm run bot:dev`
- `npm run build`

Telegram setup:

1. Set `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, and `TELEGRAM_BOT_TOKEN`.
2. Keep `TELEGRAM_BOT_MODE="polling"` for local development.
3. Optionally tune `TELEGRAM_WATCH_LIMIT` for `/watch` replies.
4. Run `npm run bot:dev`.

Webhook deployment is not enabled in this MVP step, but `TELEGRAM_BOT_MODE`, `TELEGRAM_WEBHOOK_URL`, and `TELEGRAM_WEBHOOK_SECRET` are reserved so the same bot module can be reused when a webhook route is added.

## Notes

- The MVP intentionally avoids auth, billing, alerts, websockets, and trading-oriented UX.
- Database persistence is optional for the UI shell. If `DATABASE_URL` is missing, the analysis page still renders live API-backed data.
- The Telegram bot replies with short informational summaries and links back to the stored web result page when `NEXT_PUBLIC_APP_URL` is configured.
- Background sync is incremental by design: it discovers active markets via the Polymarket events endpoint, scores only a bounded candidate set, and avoids syncing the full universe blindly.
