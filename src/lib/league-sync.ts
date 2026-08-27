import { database, ensureSchema } from "@/lib/database";
import { LEAGUES } from "@/lib/sleeper";

const API = "https://api.sleeper.app/v1";

type SleeperUser = { user_id: string; display_name?: string; username?: string; metadata?: { team_name?: string } };
type SleeperRoster = { roster_id: number; owner_id: string; settings?: { wins?: number; losses?: number; ties?: number; fpts?: number; fpts_decimal?: number; fpts_against?: number; fpts_against_decimal?: number; total_moves?: number } };
type SleeperMatchup = { roster_id: number; matchup_id?: number | null; points?: number; players_points?: Record<string, number> };
type SleeperLeague = { name?: string; status?: string };
type SleeperTransaction = { transaction_id: string; type: string; status: string; created?: number };

async function sleeper<T>(path: string) {
  const response = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Sleeper request failed: ${path}`);
  return response.json() as Promise<T>;
}

const points = (whole?: number, decimal?: number) => (whole || 0) + (decimal || 0) / 100;

type Write = { text: string; params: unknown[] };

async function writeInBatches(writes: Write[]) {
  const sql = database();
  for (let index = 0; index < writes.length; index += 100) {
    const batch = writes.slice(index, index + 100);
    await sql.transaction((transaction) => batch.map((write) => transaction.query(write.text, write.params)));
  }
}

export async function syncSleeperHistory() {
  await ensureSchema();
  const sql = database();
  let importedScores = 0;
  let importedTransactions = 0;

  for (const { id: leagueId, season } of LEAGUES) {
    const [league, users, rosters] = await Promise.all([
      sleeper<SleeperLeague>(`/league/${leagueId}`),
      sleeper<SleeperUser[]>(`/league/${leagueId}/users`),
      sleeper<SleeperRoster[]>(`/league/${leagueId}/rosters`)
    ]);
    await sql.query(
      `insert into league_seasons (league_id, season, name, status, synced_at) values ($1, $2, $3, $4, now())
       on conflict (league_id) do update set season = excluded.season, name = excluded.name, status = excluded.status, synced_at = now()`,
      [leagueId, season, league.name || null, league.status || null]
    );
    await writeInBatches(users.map((user) => ({
      text: `insert into managers (user_id, display_name, username, current_team_name, updated_at) values ($1, $2, $3, $4, now())
        on conflict (user_id) do update set display_name = excluded.display_name, username = excluded.username, current_team_name = excluded.current_team_name, updated_at = now()`,
      params: [user.user_id, user.display_name || null, user.username || null, user.metadata?.team_name || user.display_name || user.username || null]
    })));
    await sql.query("delete from roster_seasons where league_id = $1", [leagueId]);
    await sql.query("delete from weekly_scores where league_id = $1", [leagueId]);
    await sql.query("delete from league_transactions where league_id = $1", [leagueId]);
    const rosterWrites: Write[] = rosters.map((roster) => {
      const settings = roster.settings || {};
      return { text: `insert into roster_seasons (league_id, roster_id, user_id, wins, losses, ties, points_for, points_against, total_moves)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, params: [leagueId, roster.roster_id, roster.owner_id, settings.wins || 0, settings.losses || 0, settings.ties || 0, points(settings.fpts, settings.fpts_decimal), points(settings.fpts_against, settings.fpts_against_decimal), settings.total_moves || 0] };
    });
    await writeInBatches(rosterWrites);
    const [weekResults, transactionResults] = await Promise.all([
      Promise.all(Array.from({ length: 18 }, (_, index) => sleeper<SleeperMatchup[]>(`/league/${leagueId}/matchups/${index + 1}`))),
      Promise.all(Array.from({ length: 18 }, (_, index) => sleeper<SleeperTransaction[]>(`/league/${leagueId}/transactions/${index + 1}`)))
    ]);
    const historyWrites: Write[] = [];
    for (const [weekIndex, matchups] of weekResults.entries()) {
      for (const matchup of matchups) {
        historyWrites.push({ text: "insert into weekly_scores (league_id, week, roster_id, matchup_id, points, players_points) values ($1, $2, $3, $4, $5, $6::jsonb)", params: [leagueId, weekIndex + 1, matchup.roster_id, matchup.matchup_id || null, matchup.points || 0, JSON.stringify(matchup.players_points || {})] });
        importedScores += 1;
      }
    }
    for (const [weekIndex, transactions] of transactionResults.entries()) {
      for (const transaction of transactions.filter((item) => item.status === "complete")) {
        historyWrites.push({ text: "insert into league_transactions (transaction_id, league_id, week, transaction_type, created_at, payload) values ($1, $2, $3, $4, $5, $6::jsonb)", params: [transaction.transaction_id, leagueId, weekIndex + 1, transaction.type, transaction.created ? new Date(transaction.created).toISOString() : null, JSON.stringify(transaction)] });
        importedTransactions += 1;
      }
    }
    await writeInBatches(historyWrites);
  }
  return { leagues: LEAGUES.length, scores: importedScores, transactions: importedTransactions, syncedAt: new Date().toISOString() };
}
