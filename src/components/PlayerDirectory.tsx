"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Player = { id: string; name: string; position: string; team: string };
export function PlayerDirectory({ players }: { players: Player[] }) {
  const [query, setQuery] = useState(""); const [position, setPosition] = useState("all");
  const shown = useMemo(() => players.filter((player) => (position === "all" || player.position === position) && `${player.name} ${player.team}`.toLowerCase().includes(query.toLowerCase())).slice(0, 150), [players, position, query]);
  return <><div className="report-controls"><label>Search players<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or NFL team" /></label><div><span>Position</span>{["all", "QB", "RB", "WR", "TE", "K", "DEF"].map((item) => <button className={position === item ? "active" : ""} onClick={() => setPosition(item)} key={item}>{item}</button>)}</div></div><p className="result-count">{shown.length} players shown</p><div className="player-directory">{shown.map((player) => <Link href={`/players/${player.id}`} key={player.id}><strong>{player.name}</strong><span>{player.position} · {player.team}</span></Link>)}</div></>;
}
