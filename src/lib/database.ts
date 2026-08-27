import { neon } from "@neondatabase/serverless";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

export async function ensureSchema() {
  const sql = database();
  const statements = [
    `
    create table if not exists league_seasons (
      league_id text primary key,
      season integer not null,
      name text,
      status text,
      synced_at timestamptz not null default now()
    )`, `
    create table if not exists managers (
      user_id text primary key,
      display_name text,
      username text,
      current_team_name text,
      updated_at timestamptz not null default now()
    )`, `
    create table if not exists roster_seasons (
      league_id text not null references league_seasons(league_id) on delete cascade,
      roster_id integer not null,
      user_id text not null references managers(user_id),
      wins integer not null default 0,
      losses integer not null default 0,
      ties integer not null default 0,
      points_for numeric not null default 0,
      points_against numeric not null default 0,
      total_moves integer not null default 0,
      primary key (league_id, roster_id)
    )`, `
    create table if not exists weekly_scores (
      league_id text not null references league_seasons(league_id) on delete cascade,
      week integer not null,
      roster_id integer not null,
      matchup_id integer,
      points numeric not null default 0,
      players_points jsonb not null default '{}'::jsonb,
      primary key (league_id, week, roster_id)
    )`, `
    create table if not exists league_transactions (
      transaction_id text primary key,
      league_id text not null references league_seasons(league_id) on delete cascade,
      week integer not null,
      transaction_type text not null,
      created_at timestamptz,
      payload jsonb not null
    )`,
    "create index if not exists weekly_scores_league_week_idx on weekly_scores (league_id, week)",
    "create index if not exists league_transactions_league_idx on league_transactions (league_id, transaction_type)"
  ];
  for (const statement of statements) await sql.query(statement);
}
