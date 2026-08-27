import playerInfo from "@/data/player-info.json";

const API = "https://api.sleeper.app/v1";

export const LEAGUES = [
  { id: "1352477003575459840", season: 2026 },
  { id: "1180222319050293248", season: 2025 },
  { id: "1043977894579732480", season: 2024 }
] as const;

type League = { name: string; season: string; status: string; settings: { leg?: number; playoff_week_start?: number } };
type User = { user_id: string; display_name: string; username?: string; metadata?: { team_name?: string } };
type Roster = { roster_id: number; owner_id: string; settings: { wins?: number; losses?: number; ties?: number; fpts?: number; fpts_decimal?: number; fpts_against?: number; fpts_against_decimal?: number; total_moves?: number } };
type Transaction = { transaction_id: string; type: string; status: string; roster_ids: number[]; leg: number; created: number; adds?: Record<string, number>; drops?: Record<string, number>; draft_picks?: Array<{ season: string; round: number; roster_id: number; owner_id: number; previous_owner_id: number }>; settings?: { waiver_bid?: number } };
type Matchup = { roster_id: number; players_points?: Record<string, number> };
type Draft = { draft_id: string; season: string; type: string; settings: { rounds?: number } };
type DraftPick = { pick_no: number; round: number; draft_slot: number; roster_id: number; picked_by: string; metadata: { first_name?: string; last_name?: string; position?: string; team?: string }; player_id: string };
type TradedPick = { round: number; roster_id: number; owner_id: number; previous_owner_id: number };

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`Sleeper request failed: ${path}`);
  return response.json() as Promise<T>;
}

function teamName(user: User | undefined) {
  return user?.metadata?.team_name || user?.display_name || user?.username || "Unknown team";
}

export type ManagerTotal = { id: string; name: string; managerName: string; seasons: number; wins: number; losses: number; ties: number; pf: number; pa: number; moves: number; latestPf: number };
export type PlayerMove = { id: string; name: string; position: string; team: string };
export type ActivityTeam = { id: string; name: string; managerName: string };
export type Activity = { id: string; season: number; type: string; teams: ActivityTeam[]; created: number; adds: number; drops: number; bid?: number; playerIds: string[]; players?: PlayerMove[] };
export type TradeSide = { team: ActivityTeam; players: PlayerMove[]; draftPicks: string[]; pf: number; delta: number };
export type TradeAnalysis = { id: string; season: number; created: number; sides: TradeSide[] };

export async function getLeagueDashboard() {
  const records = await Promise.all(LEAGUES.map(async ({ id, season }) => {
    const [league, users, rosters] = await Promise.all([
      get<League>(`/league/${id}`), get<User[]>(`/league/${id}/users`), get<Roster[]>(`/league/${id}/rosters`)
    ]);
    const legs = Math.max(league.settings.leg ?? 0, league.settings.playoff_week_start ? league.settings.playoff_week_start + 3 : 0, 18);
    const transactions = (await Promise.all(Array.from({ length: legs }, (_, index) => get<Transaction[]>(`/league/${id}/transactions/${index + 1}`)))).flat()
      .filter((transaction) => transaction.status === "complete");
    return { id, season, league, users, rosters, transactions };
  }));

  const totals = new Map<string, ManagerTotal>();
  const activity: Activity[] = [];
  for (const record of records) {
    const users = new Map(record.users.map((user) => [user.user_id, user]));
    const rosterOwners = new Map(record.rosters.map((roster) => [roster.roster_id, roster.owner_id]));
    for (const roster of record.rosters) {
      const user = users.get(roster.owner_id);
      const existing = totals.get(roster.owner_id) ?? { id: roster.owner_id, name: teamName(user), managerName: user?.display_name || "Unknown manager", seasons: 0, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, moves: 0, latestPf: 0 };
      existing.name = teamName(user);
      existing.managerName = user?.display_name || existing.managerName;
      existing.seasons += 1;
      existing.wins += roster.settings.wins ?? 0;
      existing.losses += roster.settings.losses ?? 0;
      existing.ties += roster.settings.ties ?? 0;
      existing.pf += (roster.settings.fpts ?? 0) + (roster.settings.fpts_decimal ?? 0) / 100;
      existing.pa += (roster.settings.fpts_against ?? 0) + (roster.settings.fpts_against_decimal ?? 0) / 100;
      existing.moves += roster.settings.total_moves ?? 0;
      if (record.season === 2025) existing.latestPf = (roster.settings.fpts ?? 0) + (roster.settings.fpts_decimal ?? 0) / 100;
      totals.set(roster.owner_id, existing);
    }
    for (const transaction of record.transactions) {
      activity.push({
        id: transaction.transaction_id,
        season: record.season,
        type: transaction.type,
        teams: transaction.roster_ids.map((id) => {
          const user = users.get(rosterOwners.get(id) ?? "");
          return { id: user?.user_id || String(id), name: teamName(user), managerName: user?.display_name || "Unknown manager" };
        }),
        created: transaction.created,
        adds: Object.keys(transaction.adds ?? {}).length,
        drops: Object.keys(transaction.drops ?? {}).length,
        bid: transaction.settings?.waiver_bid
        ,playerIds: [...Object.keys(transaction.adds ?? {}), ...Object.keys(transaction.drops ?? {})]
      });
    }
  }
  // Sleeper renews a league each season. Always present the active league's team
  // identity, while retaining that person's results from every prior season.
  const activeUsers = new Map(records[0].users.map((user) => [user.user_id, user]));
  const identityFor = (userId: string, fallback?: ActivityTeam) => {
    const user = activeUsers.get(userId);
    return user ? { id: user.user_id, name: teamName(user), managerName: user.display_name } : fallback || { id: userId, name: "Unknown team", managerName: "Unknown manager" };
  };
  const managers = [...totals.values()].map((manager) => {
    const identity = identityFor(manager.id);
    return { ...manager, name: identity.name, managerName: identity.managerName };
  }).sort((a, b) => b.pf - a.pf);
  const power = [...managers].sort((a, b) => (b.latestPf || b.pf / b.seasons) + (b.wins - b.losses) * 25 - ((a.latestPf || a.pf / a.seasons) + (a.wins - a.losses) * 25));
  return { records, managers, power, activity: activity.map((item) => ({ ...item, teams: item.teams.map((team) => identityFor(team.id, team)) })).sort((a, b) => b.created - a.created) };
}

export async function getTeamProfile(userId: string) {
  const dashboard = await getLeagueDashboard();
  const manager = dashboard.managers.find((item) => item.id === userId);
  if (!manager) return null;
  const seasons = dashboard.records.map((record) => {
    const roster = record.rosters.find((item) => item.owner_id === userId);
    if (!roster) return null;
    const transactions = record.transactions.filter((item) => item.roster_ids.includes(roster.roster_id));
    return { season: record.season, status: record.league.status, wins: roster.settings.wins ?? 0, losses: roster.settings.losses ?? 0, ties: roster.settings.ties ?? 0, pf: (roster.settings.fpts ?? 0) + (roster.settings.fpts_decimal ?? 0) / 100, pa: (roster.settings.fpts_against ?? 0) + (roster.settings.fpts_against_decimal ?? 0) / 100, moves: roster.settings.total_moves ?? 0, transactions: transactions.length };
  }).filter((season): season is NonNullable<typeof season> => season !== null);
  return { manager, seasons };
}

export type HistoryRow = { id: string; name: string; managerName: string; seasons: Record<number, { wins: number; losses: number; ties: number; pf: number; pa: number; moves: number }> };

export async function getHistoryReport() {
  const dashboard = await getLeagueDashboard();
  const rows = new Map<string, HistoryRow>();
  for (const record of dashboard.records) {
    for (const roster of record.rosters) {
      const manager = dashboard.managers.find((item) => item.id === roster.owner_id);
      if (!manager) continue;
      const row = rows.get(manager.id) || { id: manager.id, name: manager.name, managerName: manager.managerName, seasons: {} };
      row.seasons[record.season] = { wins: roster.settings.wins ?? 0, losses: roster.settings.losses ?? 0, ties: roster.settings.ties ?? 0, pf: (roster.settings.fpts ?? 0) + (roster.settings.fpts_decimal ?? 0) / 100, pa: (roster.settings.fpts_against ?? 0) + (roster.settings.fpts_against_decimal ?? 0) / 100, moves: roster.settings.total_moves ?? 0 };
      rows.set(manager.id, row);
    }
  }
  return { seasons: dashboard.records.map((record) => record.season).filter((season) => season < 2026), rows: [...rows.values()] };
}

export async function getDraftArchive() {
  const dashboard = await getLeagueDashboard();
  const activeManagers = new Map(dashboard.managers.map((manager) => [manager.id, manager]));
  return Promise.all(dashboard.records.filter((record) => record.season < 2026).map(async (record) => {
    const drafts = await get<Draft[]>(`/league/${record.id}/drafts`);
    const draft = drafts[0];
    if (!draft) return null;
    const [picks, tradedPicks] = await Promise.all([get<DraftPick[]>(`/draft/${draft.draft_id}/picks`), get<TradedPick[]>(`/draft/${draft.draft_id}/traded_picks`)]);
    const owners = new Map(record.rosters.map((roster) => [roster.roster_id, record.users.find((user) => user.user_id === roster.owner_id)]));
    const team = (rosterId: number) => {
      const user = owners.get(rosterId);
      const manager = activeManagers.get(user?.user_id || "");
      return { rosterId, name: manager?.name || teamName(user), managerName: manager?.managerName || user?.display_name || "Unknown manager", id: user?.user_id || String(rosterId) };
    };
    const traded = new Map(tradedPicks.map((pick) => [`${pick.round}-${pick.roster_id}`, pick]));
    return { season: record.season, rounds: draft.settings.rounds ?? 0, picks: picks.map((pick) => {
      const trade = traded.get(`${pick.round}-${pick.roster_id}`);
      return { pickNo: pick.pick_no, round: pick.round, playerId: pick.player_id, playerName: [pick.metadata.first_name, pick.metadata.last_name].filter(Boolean).join(" ") || `Player #${pick.player_id}`, position: pick.metadata.position || "", team: pick.metadata.team || "", owner: team(pick.roster_id), originalOwner: trade ? team(trade.roster_id) : null, traded: Boolean(trade) };
    }) };
  })).then((drafts) => drafts.filter((draft): draft is NonNullable<typeof draft> => draft !== null));
}

export async function getTransactionArchive() {
  const dashboard = await getLeagueDashboard();
  return dashboard.activity.map((activity) => ({
    ...activity,
    players: activity.playerIds.slice(0, 4).map((id) => {
      const player = playerInfo[id as keyof typeof playerInfo];
      return player ? { id, ...player } : { id, name: `Player #${id}`, position: "", team: "" };
    })
  }));
}

export async function getTradeAnalysis() {
  const dashboard = await getLeagueDashboard();
  const currentManagers = new Map(dashboard.managers.map((manager) => [manager.id, manager]));
  const trades: TradeAnalysis[] = [];
  for (const record of dashboard.records.filter((item) => item.season < 2026)) {
    const ownerByRoster = new Map(record.rosters.map((roster) => [roster.roster_id, roster.owner_id]));
    const teamFor = (rosterId: number): ActivityTeam => {
      const manager = currentManagers.get(ownerByRoster.get(rosterId) || "");
      return manager ? { id: manager.id, name: manager.name, managerName: manager.managerName } : { id: String(rosterId), name: "Unknown team", managerName: "Unknown manager" };
    };
    const matchupWeeks = await Promise.all(Array.from({ length: 18 }, (_, index) => get<Matchup[]>(`/league/${record.id}/matchups/${index + 1}`)));
    for (const trade of record.transactions.filter((item) => item.type === "trade")) {
      const sides = trade.roster_ids.map((rosterId) => {
        const playerIds = Object.entries(trade.adds || {}).filter(([, recipient]) => recipient === rosterId).map(([playerId]) => playerId);
        const players = playerIds.map((id) => {
          const player = playerInfo[id as keyof typeof playerInfo];
          return player ? { id, ...player } : { id, name: `Player #${id}`, position: "", team: "" };
        });
        const pf = matchupWeeks.slice(trade.leg).reduce((sum, week) => {
          const matchup = week.find((item) => item.roster_id === rosterId);
          return sum + playerIds.reduce((playerSum, playerId) => playerSum + (matchup?.players_points?.[playerId] || 0), 0);
        }, 0);
        const draftPicks = (trade.draft_picks || []).filter((pick) => pick.owner_id === rosterId).map((pick) => `${pick.season} R${pick.round} · from ${teamFor(pick.roster_id).name}`);
        return { team: teamFor(rosterId), players, draftPicks, pf, delta: 0 };
      });
      if (sides.length === 2) { sides[0].delta = sides[0].pf - sides[1].pf; sides[1].delta = -sides[0].delta; }
      trades.push({ id: trade.transaction_id, season: record.season, created: trade.created, sides });
    }
  }
  return trades.sort((a, b) => b.created - a.created);
}
