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
type Matchup = { roster_id: number; matchup_id?: number | null; points?: number; players_points?: Record<string, number> };
type Draft = { draft_id: string; season: string; type: string; settings: { rounds?: number } };
type DraftPick = { pick_no: number; round: number; draft_slot: number; roster_id: number; picked_by: string; metadata: { first_name?: string; last_name?: string; position?: string; team?: string }; player_id: string };
type TradedPick = { round: number; roster_id: number; owner_id: number; previous_owner_id: number };
type SleeperPlayer = { first_name?: string; last_name?: string; full_name?: string; position?: string; team?: string };

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
export type Activity = { id: string; season: number; type: string; teams: ActivityTeam[]; created: number; adds: number; drops: number; bid?: number; playerIds: string[]; draftPicks?: string[]; players?: PlayerMove[] };
export type AnalyticsRow = ManagerTotal & { expectedWins: number; allPlayWins: number; allPlayLosses: number; luck: number };
export type WeeklyScore = { season: number; week: number; managerId: string; points: number };
export type AnalyticsReport = { key: string; label: string; rows: AnalyticsRow[]; weeklyScores: WeeklyScore[] };
export type TradeReceiptSide = { team: ActivityTeam; players: PlayerMove[]; picks: Array<{ label: string; realized?: PlayerMove }>; pf: number; delta: number };
export type TradeReceipt = { id: string; season: number; created: number; sides: TradeReceiptSide[] };
export type PlayerReference = { id: string; name: string; position: string; team: string; points: number; weekly: Array<{ season: number; week: number; points: number; team: ActivityTeam }>; activity: Activity[]; drafts: Array<{ season: number; round: number; pickNo: number; team: ActivityTeam }>; blurb: string };

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
        ,playerIds: [...Object.keys(transaction.adds ?? {}), ...Object.keys(transaction.drops ?? {})],
        draftPicks: transaction.draft_picks?.map((pick) => `${pick.season} Round ${pick.round} pick`)
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
  const activity = dashboard.activity.filter((item) => item.teams.some((team) => team.id === userId)).map((item) => ({
    ...item,
    players: item.playerIds.slice(0, 4).map((id) => {
      const player = playerInfo[id as keyof typeof playerInfo];
      return player ? { id, ...player } : { id, name: `Player #${id}`, position: "", team: "" };
    })
  }));
  return { manager, seasons, activity };
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

export async function getAnalyticsHub() {
  const dashboard = await getLeagueDashboard();
  const completedRecords = dashboard.records.filter((record) => record.season < 2026);
  const scoreWeeks = await Promise.all(completedRecords.map(async (record) => ({
    season: record.season,
    weeks: await Promise.all(Array.from({ length: 18 }, (_, index) => get<Matchup[]>(`/league/${record.id}/matchups/${index + 1}`)))
  })));
  const reportFor = (records: typeof completedRecords, label: string, key: string): AnalyticsReport => {
    const totals = new Map<string, ManagerTotal>();
    for (const record of records) for (const roster of record.rosters) {
      const manager = dashboard.managers.find((item) => item.id === roster.owner_id);
      if (!manager) continue;
      const total = totals.get(manager.id) || { ...manager, seasons: 0, wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, moves: 0, latestPf: 0 };
      total.seasons += 1;
      total.wins += roster.settings.wins || 0;
      total.losses += roster.settings.losses || 0;
      total.ties += roster.settings.ties || 0;
      total.pf += (roster.settings.fpts || 0) + (roster.settings.fpts_decimal || 0) / 100;
      total.pa += (roster.settings.fpts_against || 0) + (roster.settings.fpts_against_decimal || 0) / 100;
      total.moves += roster.settings.total_moves || 0;
      totals.set(manager.id, total);
    }
    const allPlay = new Map<string, { wins: number; losses: number }>();
    const weeklyScores: WeeklyScore[] = [];
    for (const record of records) {
      const ownerByRoster = new Map(record.rosters.map((roster) => [roster.roster_id, roster.owner_id]));
      const weeks = scoreWeeks.find((item) => item.season === record.season)?.weeks || [];
      weeks.forEach((week, weekIndex) => {
        const scored = week.filter((item) => typeof item.points === "number" && ownerByRoster.has(item.roster_id));
        for (const score of scored) {
          const managerId = ownerByRoster.get(score.roster_id)!;
          const result = allPlay.get(managerId) || { wins: 0, losses: 0 };
          result.wins += scored.filter((other) => (score.points || 0) > (other.points || 0)).length;
          result.losses += scored.filter((other) => (score.points || 0) < (other.points || 0)).length;
          allPlay.set(managerId, result);
          weeklyScores.push({ season: record.season, week: weekIndex + 1, managerId, points: score.points || 0 });
        }
      });
    }
    const rows = [...totals.values()].map((manager) => {
      const record = allPlay.get(manager.id) || { wins: 0, losses: 0 };
      const games = manager.wins + manager.losses + manager.ties;
      const expectedWins = record.wins + record.losses ? record.wins / (record.wins + record.losses) * games : 0;
      return { ...manager, expectedWins, allPlayWins: record.wins, allPlayLosses: record.losses, luck: manager.wins - expectedWins };
    });
    return { key, label, rows, weeklyScores };
  };
  return {
    reports: [reportFor(completedRecords, "All time", "all"), ...completedRecords.map((record) => reportFor([record], String(record.season), String(record.season)))]
  };
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

export async function getPlayerReference(playerId: string): Promise<PlayerReference | null> {
  const localPlayer = playerInfo[playerId as keyof typeof playerInfo];
  const sleeperPlayers = localPlayer ? null : await get<Record<string, SleeperPlayer>>("/players/nfl");
  const remotePlayer = sleeperPlayers?.[playerId];
  const player = localPlayer || (remotePlayer ? { name: remotePlayer.full_name || [remotePlayer.first_name, remotePlayer.last_name].filter(Boolean).join(" ") || `Player #${playerId}`, position: remotePlayer.position || "", team: remotePlayer.team || "" } : null);
  if (!player) return null;
  const dashboard = await getLeagueDashboard();
  const weekly: PlayerReference["weekly"] = [];
  for (const record of dashboard.records.filter((item) => item.season < 2026)) {
    const owners = new Map(record.rosters.map((roster) => [roster.roster_id, roster.owner_id]));
    const scores = await Promise.all(Array.from({ length: 18 }, (_, index) => get<Matchup[]>(`/league/${record.id}/matchups/${index + 1}`)));
    scores.forEach((week, weekIndex) => week.forEach((matchup) => {
      const points = matchup.players_points?.[playerId];
      const owner = owners.get(matchup.roster_id);
      const manager = dashboard.managers.find((item) => item.id === owner);
      if (typeof points === "number" && manager) weekly.push({ season: record.season, week: weekIndex + 1, points, team: { id: manager.id, name: manager.name, managerName: manager.managerName } });
    }));
  }
  const activity = dashboard.activity.filter((item) => item.playerIds.includes(playerId));
  const drafts = (await getDraftArchive()).flatMap((draft) => draft.picks.filter((pick) => pick.playerId === playerId).map((pick) => ({ season: draft.season, round: pick.round, pickNo: pick.pickNo, team: { id: pick.owner.id, name: pick.owner.name, managerName: pick.owner.managerName } })));
  const points = weekly.reduce((total, item) => total + item.points, 0);
  const firstDraft = drafts[0];
  const movement = activity.length ? `He has appeared in ${activity.length} recorded league transaction${activity.length === 1 ? "" : "s"}.` : "He has not appeared in a recorded league transaction.";
  const blurb = firstDraft ? `${player.name} entered AOTW in ${firstDraft.season} as a round ${firstDraft.round} selection by ${firstDraft.team.name}. He has produced ${points.toFixed(1)} AOTW points across ${weekly.length} scored weeks. ${movement}` : `${player.name} has produced ${points.toFixed(1)} AOTW points across ${weekly.length} scored weeks. ${movement}`;
  return { id: playerId, ...player, points, weekly, activity, drafts, blurb };
}

export function getPlayerDirectory() {
  return Object.entries(playerInfo).map(([id, player]) => ({ id, ...player })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTradeLedger() {
  const dashboard = await getLeagueDashboard();
  const drafts = await getDraftArchive();
  const managers = new Map(dashboard.managers.map((manager) => [manager.id, manager]));
  const receipts: TradeReceipt[] = [];
  for (const record of dashboard.records.filter((item) => item.season < 2026)) {
    const ownerByRoster = new Map(record.rosters.map((roster) => [roster.roster_id, roster.owner_id]));
    const teamFor = (rosterId: number): ActivityTeam => {
      const manager = managers.get(ownerByRoster.get(rosterId) || "");
      return manager ? { id: manager.id, name: manager.name, managerName: manager.managerName } : { id: String(rosterId), name: "Unknown team", managerName: "Unknown manager" };
    };
    const weeks = await Promise.all(Array.from({ length: 18 }, (_, index) => get<Matchup[]>(`/league/${record.id}/matchups/${index + 1}`)));
    for (const trade of record.transactions.filter((item) => item.type === "trade")) {
      const sides = trade.roster_ids.map((rosterId) => {
        const ids = Object.entries(trade.adds || {}).filter(([, owner]) => owner === rosterId).map(([id]) => id);
        const players = ids.map((id) => {
          const player = playerInfo[id as keyof typeof playerInfo];
          return player ? { id, ...player } : { id, name: `Player #${id}`, position: "", team: "" };
        });
        const picks = (trade.draft_picks || []).filter((pick) => pick.owner_id === rosterId).map((pick) => {
          const draft = drafts.find((item) => item.season === Number(pick.season));
          const selected = draft?.picks.find((item) => item.round === pick.round && item.owner.rosterId === pick.roster_id);
          return { label: `${pick.season} Round ${pick.round} pick`, realized: selected ? { id: selected.playerId, name: selected.playerName, position: selected.position, team: selected.team } : undefined };
        });
        const pf = weeks.slice(trade.leg).reduce((total, week) => total + ids.reduce((sum, id) => sum + (week.find((matchup) => matchup.roster_id === rosterId)?.players_points?.[id] || 0), 0), 0);
        return { team: teamFor(rosterId), players, picks, pf, delta: 0 };
      });
      if (sides.length === 2) { sides[0].delta = sides[0].pf - sides[1].pf; sides[1].delta = -sides[0].delta; }
      receipts.push({ id: trade.transaction_id, season: record.season, created: trade.created, sides });
    }
  }
  return receipts.sort((a, b) => b.created - a.created);
}
