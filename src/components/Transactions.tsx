"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Activity } from "@/lib/sleeper";

const date = (value: number) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value);

export function Transactions({ activity }: { activity: Activity[] }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => activity.filter((item) => (filter === "all" || item.type === filter) && `${item.teams.map((team) => `${team.name} ${team.managerName}`).join(" ")} ${item.players?.map((player) => player.name).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [activity, filter, query]);
  const leader = (types?: string[]) => {
    const counts = new Map<string, { name: string; count: number }>();
    visible.filter((item) => !types || types.includes(item.type)).forEach((item) => item.teams.forEach((team) => {
      const current = counts.get(team.id) || { name: team.name, count: 0 };
      current.count += 1;
      counts.set(team.id, current);
    }));
    return [...counts.values()].sort((a, b) => b.count - a.count)[0] || { name: "—", count: 0 };
  };
  const activityLeader = leader(); const waiverLeader = leader(["waiver", "free_agent"]); const tradeLeader = leader(["trade"]);
  return <><div className="filters"><div>{["all", "trade", "waiver", "free_agent"].map((type) => <button className={filter === type ? "active" : ""} key={type} onClick={() => setFilter(type)}>{type.replace("_", " ")}</button>)}</div><input aria-label="Search acquisitions" placeholder="Search team or player" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <div className="activity-stats"><article><span>MOST ACTIVE</span><strong>{activityLeader.name}</strong><small>{activityLeader.count} moves</small></article><article><span>MOST WAIVER PICKUPS</span><strong>{waiverLeader.name}</strong><small>{waiverLeader.count} pickups</small></article><article><span>MOST TRADES</span><strong>{tradeLeader.name}</strong><small>{tradeLeader.count} trades</small></article></div>
    <p className="result-count">{visible.length} moves found</p><div className="transaction-table">{visible.slice(0, 100).map((item) => <article key={item.id}><time>{date(item.created)}</time><span className={`type ${item.type}`}>{item.type.replace("_", " ")}</span><div><div className="transaction-teams">{item.teams.map((team) => <Link href={`/teams/${team.id}`} key={team.id}><strong>{team.name}</strong><small>Manager: {team.managerName}</small></Link>)}</div><div className="player-list">{item.players?.length ? item.players.map((player) => <div className="player" key={player.id}>
      <Image src={`https://sleepercdn.com/content/nfl/players/thumb/${player.id}.jpg`} alt="" width={24} height={24} unoptimized />
      <span>{player.name}</span>{player.position && <small>{player.position}</small>}{player.team && <span className="nfl-team"><Image src={`https://sleepercdn.com/images/team_logos/nfl/${player.team.toLowerCase()}.png`} alt="" width={14} height={14} unoptimized />{player.team}</span>}</div>) : <p>No player movement recorded</p>}</div></div><small>{item.adds ? `${item.adds} add${item.adds > 1 ? "s" : ""}` : ""}{item.adds && item.drops ? " / " : ""}{item.drops ? `${item.drops} drop${item.drops > 1 ? "s" : ""}` : ""}{item.bid ? ` / $${item.bid}` : ""}</small></article>)}</div></>;
}
