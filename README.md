# Alumni on the Warpath — League Ledger

A live, history-first archive for the Alumni on the Warpath Sleeper league. It is a fresh Next.js rebuild of the previous league-page project.

## What it does

- Pulls league, roster, and transaction data directly from Sleeper.
- Follows the 2024, 2025, and active 2026 league chain.
- Builds all-time points, wins, manager activity, power rankings, and an acquisition feed.
- Revalidates Sleeper-backed content every 60 seconds.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploying to Vercel

Import this repository into Vercel as a new project. Vercel auto-detects Next.js; no environment variables or database are required for this first release. The project uses only Sleeper's public read-only API.

## League IDs

The active 2026 Sleeper league ID is `1352477003575459840`. The prior season chain is defined in `src/lib/sleeper.ts`.
