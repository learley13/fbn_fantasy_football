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
type Transaction = { transaction_id: string; type: string; status: string; roster_ids: number[]; created: number; adds?: Record<string, number>; drops?: Record<string, number>; settings?: { waiver_bid?: number } };
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
export type Activity = { id: string; type: string; teams: ActivityTeam[]; created: number; adds: number; drops: number; bid?: number; playerIds: string[]; players?: PlayerMove[] };

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
  const managers = [...totals.values()].sort((a, b) => b.pf - a.pf);
  const power = [...managers].sort((a, b) => (b.latestPf || b.pf / b.seasons) + (b.wins - b.losses) * 25 - ((a.latestPf || a.pf / a.seasons) + (a.wins - a.losses) * 25));
  return { records, managers, power, activity: activity.sort((a, b) => b.created - a.created) };
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

export async function getDraftArchive() {
  const dashboard = await getLeagueDashboard();
  return Promise.all(dashboard.records.filter((record) => record.season < 2026).map(async (record) => {
    const drafts = await get<Draft[]>(`/league/${record.id}/drafts`);
    const draft = drafts[0];
    if (!draft) return null;
    const [picks, tradedPicks] = await Promise.all([get<DraftPick[]>(`/draft/${draft.draft_id}/picks`), get<TradedPick[]>(`/draft/${draft.draft_id}/traded_picks`)]);
    const owners = new Map(record.rosters.map((roster) => [roster.roster_id, record.users.find((user) => user.user_id === roster.owner_id)]));
    const team = (rosterId: number) => {
      const user = owners.get(rosterId);
      return { rosterId, name: teamName(user), managerName: user?.display_name || "Unknown manager", id: user?.user_id || String(rosterId) };
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
