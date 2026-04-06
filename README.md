# ResolveRadar

ResolveRadar is a simple MVP shell for resolution-focused Polymarket analysis. A user can paste a market URL or slug, fetch the official market payload from Polymarket's public Gamma API, and receive a deterministic summary with critical dates, ambiguity flags, and a plain risk label.

## Stack

- Next.js 15 with the App Router
- TypeScript
- Tailwind CSS
- Prisma with PostgreSQL
- Zod for input and env validation
- grammY for the Telegram bot shell

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
- `npm run build`

## Notes

- The MVP intentionally avoids auth, billing, alerts, websockets, and trading-oriented UX.
- Database persistence is optional for the UI shell. If `DATABASE_URL` is missing, the analysis page still renders live API-backed data.
- The Telegram bot file is only a starter shell in this step.
