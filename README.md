# ResolveRadar

ResolveRadar is a simple MVP shell for resolution-focused Polymarket analysis. A user can paste a market URL or slug, fetch the official market payload from Polymarket's public Gamma API, and receive a deterministic summary with critical dates, ambiguity flags, and a plain risk label.

## Stack

- Next.js 15 with the App Router
- TypeScript
- Tailwind CSS
- Prisma with PostgreSQL
- Zod for input and env validation
- grammY for the Telegram bot shell

## Routes

- `/` homepage with Polymarket URL paste form
- `/analyze/[slug]` shareable analysis page
- `/watch` empty watchlist placeholder
- `/api/analyze` JSON analysis endpoint
- `/api/health` configuration health endpoint

## Local development

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npm run dev`.

If you want persistence, point `DATABASE_URL` at PostgreSQL and run:

1. `npx prisma migrate dev --name init`
2. `npm run dev`

## Notes

- The MVP intentionally avoids auth, billing, alerts, websockets, and trading-oriented UX.
- Database persistence is optional for the UI shell. If `DATABASE_URL` is missing, the analysis page still renders live API-backed data.
- The Telegram bot file is only a starter shell in this step.
