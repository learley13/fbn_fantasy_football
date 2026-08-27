"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AnalyticsReport, AnalyticsRow } from "@/lib/sleeper";

const decimals = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
type SortKey = "pf" | "pa" | "wins" | "expectedWins" | "luck";

export function AnalyticsHub({ reports }: { reports: AnalyticsReport[] }) {
  const [reportKey, setReportKey] = useState("all");
  const [managerId, setManagerId] = useState("");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("pf");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const report = reports.find((item) => item.key === reportKey) || reports[0];
  const byPoints = useMemo(() => [...report.rows].sort((a, b) => b.pf - a.pf), [report]);
  const selectedManager = report.rows.find((item) => item.id === managerId) || byPoints[0];
  const weekly = report.weeklyScores.filter((item) => item.managerId === selectedManager?.id).sort((a, b) => a.week - b.week);
  const maxScore = Math.max(...weekly.map((item) => item.points), 1);
  const mostPoints = byPoints[0];
  const luckiest = [...report.rows].sort((a, b) => b.luck - a.luck)[0];
  const unluckiest = [...report.rows].sort((a, b) => a.luck - b.luck)[0];
  const weeklyHigh = [...report.weeklyScores].sort((a, b) => b.points - a.points)[0];
  const highScorer = report.rows.find((item) => item.id === weeklyHigh?.managerId);
  const pfMin = Math.min(...report.rows.map((item) => item.pf));
  const pfRange = Math.max(...report.rows.map((item) => item.pf)) - pfMin || 1;
  const paMin = Math.min(...report.rows.map((item) => item.pa));
  const paRange = Math.max(...report.rows.map((item) => item.pa)) - paMin || 1;
  const tableRows = useMemo(() => report.rows
    .filter((row) => `${row.name} ${row.managerName}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a[sortKey] - b[sortKey]) * (sortDirection === "desc" ? -1 : 1)), [query, report.rows, sortDirection, sortKey]);
  const chooseSort = (key: SortKey) => key === sortKey ? setSortDirection((direction) => direction === "desc" ? "asc" : "desc") : (setSortKey(key), setSortDirection("desc"));
  const team = (row: AnalyticsRow | undefined, className?: string) => row ? <Link className={className} href={`/teams/${row.id}`}>{row.name}</Link> : "—";

  return <>
    <div className="analytics-controls"><label>Reporting window<select value={reportKey} onChange={(event) => { setReportKey(event.target.value); setManagerId(""); }}>{reports.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><p><b>All-play record</b> compares each weekly score against every other team’s score that week.</p></div>
    <section className="analytics-cards" aria-label="League highlights"><article><span>Scoring leader <i title="Ranked by total fantasy points scored in the selected reporting window.">i</i></span><strong>{team(mostPoints, "analytics-team-link")}</strong><b>{decimals.format(mostPoints?.pf || 0)} PF</b></article><article className="positive"><span>Luckiest record <i title="Luck = actual wins minus expected wins. Expected wins are calculated from the franchise's all-play record: how often its weekly score beat every other score that week.">i</i></span><strong>{team(luckiest, "analytics-team-link")}</strong><b>+{decimals.format(luckiest?.luck || 0)} wins</b></article><article className="negative"><span>Most unlucky <i title="Luck = actual wins minus expected wins. A negative number means the team won fewer games than its weekly scores would normally produce against this league's schedules.">i</i></span><strong>{team(unluckiest, "analytics-team-link")}</strong><b>{decimals.format(unluckiest?.luck || 0)} wins</b></article><article><span>Weekly high <i title="Highest single weekly fantasy-point total in the selected reporting window.">i</i></span><strong>{team(highScorer, "analytics-team-link")}</strong><b>{decimals.format(weeklyHigh?.points || 0)} points</b></article></section>
    <section className="analytics-section"><div className="analytics-heading"><div><p className="label">FORTUNE MAP</p><h2>Scoring versus<br /><em>schedule.</em></h2></div><p><b>Y-axis:</b> points scored. <b>X-axis:</b> points allowed. Hover a marker for values; click a franchise for its record.</p></div><div className="fortune-map" role="img" aria-label="Points for on the vertical axis compared with points against on the horizontal axis"><span className="map-y">POINTS FOR ↑</span><span className="map-x">POINTS AGAINST →</span>{report.rows.map((row) => <Link key={row.id} href={`/teams/${row.id}`} className="map-point" style={{ left: `${10 + ((row.pa - paMin) / paRange) * 78}%`, bottom: `${10 + ((row.pf - pfMin) / pfRange) * 74}%` }}><b>{row.name.slice(0, 2).toUpperCase()}</b><span>{row.name}</span><i>{decimals.format(row.pf)} PF · {decimals.format(row.pa)} PA</i></Link>)}</div></section>
    <section className="analytics-section two-up"><div><p className="label">WEEKLY TRAJECTORY</p><h2>Every week<br /><em>counts.</em></h2><label className="chart-picker">Franchise<select value={selectedManager?.id || ""} onChange={(event) => setManagerId(event.target.value)}>{byPoints.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.managerName}</option>)}</select></label><div className="weekly-chart" aria-label={`${selectedManager?.name || "Team"} weekly fantasy point totals`}><span className="weekly-y-label">FANTASY POINTS</span><div className="weekly-bars">{weekly.map((item) => <div className="weekly-bar" key={`${item.season}-${item.week}`}><span style={{ height: `${Math.max(5, item.points / maxScore * 100)}%` }} /><em>{item.season} · Week {item.week}<b>{decimals.format(item.points)} PF</b></em><small>{item.week}</small></div>)}</div><span className="weekly-x-label">WEEK</span></div><p className="chart-note">{team(selectedManager, "analytics-team-link")} · {decimals.format(selectedManager?.pf || 0)} total PF · {weekly.length} scored weeks. Hover a bar for its exact score.</p></div><div className="luck-table"><p className="label">ACTUAL VS. EXPECTED</p><h2>The luck<br /><em>ledger.</em></h2><div>{[...report.rows].sort((a, b) => b.luck - a.luck).map((row) => <Link href={`/teams/${row.id}`} key={row.id}><span>{row.name}</span><b>{row.wins.toFixed(0)} actual</b><small>{decimals.format(row.expectedWins)} expected · <i className={row.luck >= 0 ? "up" : "down"}>{row.luck >= 0 ? "+" : ""}{decimals.format(row.luck)}</i></small></Link>)}</div></div></section>
    <section className="analytics-section report-table"><div className="analytics-heading"><div><p className="label">REPORT BUILDER</p><h2>League<br /><em>table.</em></h2></div><p>Filter franchises or managers, then click a metric to sort. Click the active metric again to reverse the order.</p></div><div className="report-controls"><label>Find a franchise<input aria-label="Find a franchise or manager" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Team or manager" /></label><div><span>Sort by</span>{(["pf", "pa", "wins", "expectedWins", "luck"] as SortKey[]).map((key) => <button className={sortKey === key ? "active" : ""} onClick={() => chooseSort(key)} key={key}>{key === "expectedWins" ? "Expected W" : key.toUpperCase()}{sortKey === key ? (sortDirection === "desc" ? " ↓" : " ↑") : ""}</button>)}</div></div><p className="result-count">{tableRows.length} of {report.rows.length} franchises shown</p><div className="table-wrap"><table><thead><tr><th>FRANCHISE</th><th>W-L</th><th>PF</th><th>PA</th><th>ALL-PLAY</th><th>EXPECTED W</th><th>LUCK</th></tr></thead><tbody>{tableRows.map((row) => <tr key={row.id}><td><Link className="table-team" href={`/teams/${row.id}`}><strong>{row.name}</strong><small>{row.managerName}</small></Link></td><td>{row.wins}-{row.losses}</td><td>{decimals.format(row.pf)}</td><td>{decimals.format(row.pa)}</td><td>{row.allPlayWins}-{row.allPlayLosses}</td><td>{decimals.format(row.expectedWins)}</td><td className={row.luck >= 0 ? "luck-up" : "luck-down"}>{row.luck >= 0 ? "+" : ""}{decimals.format(row.luck)}</td></tr>)}</tbody></table></div></section>
  </>;
}
