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
  return <><div className="filters"><div>{["all", "trade", "waiver", "free_agent"].map((type) => <button className={filter === type ? "active" : ""} key={type} onClick={() => setFilter(type)}>{type.replace("_", " ")}</button>)}</div><input aria-label="Search acquisitions" placeholder="Search team or player" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <p className="result-count">{visible.length} moves found</p><div className="transaction-table">{visible.slice(0, 100).map((item) => <article key={item.id}><time>{date(item.created)}</time><span className={`type ${item.type}`}>{item.type.replace("_", " ")}</span><div><div className="transaction-teams">{item.teams.map((team) => <Link href={`/teams/${team.id}`} key={team.id}><strong>{team.name}</strong><small>Manager: {team.managerName}</small></Link>)}</div><div className="player-list">{item.players?.length ? item.players.map((player) => <div className="player" key={player.id}>
      <Image src={`https://sleepercdn.com/content/nfl/players/thumb/${player.id}.jpg`} alt="" width={24} height={24} unoptimized />
      <span>{player.name}</span>{player.position && <small>{player.position}</small>}{player.team && <span className="nfl-team"><Image src={`https://sleepercdn.com/images/team_logos/nfl/${player.team.toLowerCase()}.png`} alt="" width={14} height={14} unoptimized />{player.team}</span>}</div>) : <p>No player movement recorded</p>}</div></div><small>{item.adds ? `${item.adds} add${item.adds > 1 ? "s" : ""}` : ""}{item.adds && item.drops ? " / " : ""}{item.drops ? `${item.drops} drop${item.drops > 1 ? "s" : ""}` : ""}{item.bid ? ` / $${item.bid}` : ""}</small></article>)}</div></>;
}
