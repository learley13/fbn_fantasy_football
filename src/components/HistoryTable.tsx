"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { HistoryRow } from "@/lib/sleeper";

type Metric = "pf" | "pa" | "wins" | "moves";
export function HistoryTable({ seasons, rows }: { seasons: number[]; rows: HistoryRow[] }) {
  const [season, setSeason] = useState("all");
  const [metric, setMetric] = useState<Metric>("pf");
  const values = useMemo(() => rows.map((row) => {
    const selected = season === "all" ? Object.values(row.seasons) : [row.seasons[Number(season)]].filter(Boolean);
    const total = selected.reduce((sum, stats) => ({ wins: sum.wins + stats.wins, losses: sum.losses + stats.losses, ties: sum.ties + stats.ties, pf: sum.pf + stats.pf, pa: sum.pa + stats.pa, moves: sum.moves + stats.moves }), { wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, moves: 0 });
    return { ...row, total };
  }).sort((a, b) => b.total[metric] - a.total[metric]), [rows, season, metric]);
  return <><div className="table-controls"><label>Season<select value={season} onChange={(event) => setSeason(event.target.value)}><option value="all">All time</option>{seasons.map((year) => <option key={year} value={year}>{year}</option>)}</select></label><label>Sort by<select value={metric} onChange={(event) => setMetric(event.target.value as Metric)}><option value="pf">Points for</option><option value="pa">Points against</option><option value="wins">Wins</option><option value="moves">Moves</option></select></label></div><div className="table-wrap"><table><thead><tr><th>Team / Manager</th><th>Record</th><th>PF</th><th>PA</th><th>Moves</th></tr></thead><tbody>{values.map((row, index) => <tr key={row.id}><td><b>{String(index + 1).padStart(2, "0")}</b><Link className="table-team" href={`/teams/${row.id}`}><strong>{row.name}</strong><small>Manager: {row.managerName}</small></Link></td><td>{row.total.wins}-{row.total.losses}{row.total.ties ? `-${row.total.ties}` : ""}</td><td>{row.total.pf.toFixed(1)}</td><td>{row.total.pa.toFixed(1)}</td><td>{row.total.moves}</td></tr>)}</tbody></table></div></>;
}
