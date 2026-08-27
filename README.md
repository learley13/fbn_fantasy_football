# Alumni on the Warpath — League Ledger

A live, history-first archive for the Alumni on the Warpath Sleeper league. It is a fresh Next.js rebuild of the previous league-page project.

## What it does

- Pulls league, roster, and transaction data directly from Sleeper.
- Follows the 2024, 2025, and active 2026 league chain.
- Builds all-time points, wins, manager activity, power rankings, and an acquisition feed.
- Revalidates Sleeper-backed content every 60 seconds.
- Includes an Analytics Hub for schedule-adjusted records, scoring trajectories, and all-play results.
- Can persist Sleeper history to Neon Postgres with a daily Vercel sync.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploying to Vercel

Import this repository into Vercel as a new project. Vercel auto-detects Next.js.

### Optional analytics database

The Analytics Hub works from Sleeper directly. To preserve the historical archive and enable richer reports, create a free Neon Postgres database, then add these environment variables locally and in Vercel:

```bash
DATABASE_URL=postgresql://...
CRON_SECRET=a-long-random-value
```

The daily Vercel Cron job calls `/api/sync`, creates the reporting tables on its first run, and refreshes the Sleeper league chain. Vercel sends `CRON_SECRET` as a bearer token automatically. Do not browse to that endpoint manually without the authorization header.

## League IDs

The active 2026 Sleeper league ID is `1352477003575459840`. The prior season chain is defined in `src/lib/sleeper.ts`.
