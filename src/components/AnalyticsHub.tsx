"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AnalyticsReport } from "@/lib/sleeper";

const decimals = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export function AnalyticsHub({ reports }: { reports: AnalyticsReport[] }) {
  const [reportKey, setReportKey] = useState("all");
  const report = reports.find((item) => item.key === reportKey) || reports[0];
  const [managerId, setManagerId] = useState(report.rows[0]?.id || "");
  const sorted = useMemo(() => [...report.rows].sort((a, b) => b.pf - a.pf), [report]);
  const selectedManager = report.rows.find((item) => item.id === managerId) || sorted[0];
  const weekly = report.weeklyScores.filter((item) => item.managerId === selectedManager?.id).sort((a, b) => a.week - b.week);
  const maxScore = Math.max(...weekly.map((item) => item.points), 1);
  const mostPoints = sorted[0];
  const luckiest = [...report.rows].sort((a, b) => b.luck - a.luck)[0];
  const unluckiest = [...report.rows].sort((a, b) => a.luck - b.luck)[0];
  const weeklyHigh = [...report.weeklyScores].sort((a, b) => b.points - a.points)[0];
  const highScorer = report.rows.find((item) => item.id === weeklyHigh?.managerId);
  const pfMin = Math.min(...report.rows.map((item) => item.pf));
  const pfRange = Math.max(...report.rows.map((item) => item.pf)) - pfMin || 1;
  const paMin = Math.min(...report.rows.map((item) => item.pa));
  const paRange = Math.max(...report.rows.map((item) => item.pa)) - paMin || 1;

  return <>
    <div className="analytics-controls">
      <label>Reporting window<select value={reportKey} onChange={(event) => { setReportKey(event.target.value); setManagerId(""); }}>
        {reports.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select></label>
      <p><b>All-play record</b> compares each weekly score against every other team’s score that week.</p>
    </div>

    <section className="analytics-cards" aria-label="League highlights">
      <article><span>Scoring leader</span><strong>{mostPoints?.name}</strong><b>{decimals.format(mostPoints?.pf || 0)} PF</b></article>
      <article className="positive"><span>Luckiest record</span><strong>{luckiest?.name}</strong><b>+{decimals.format(luckiest?.luck || 0)} wins</b></article>
      <article className="negative"><span>Most unlucky</span><strong>{unluckiest?.name}</strong><b>{decimals.format(unluckiest?.luck || 0)} wins</b></article>
      <article><span>Weekly high</span><strong>{highScorer?.name || "—"}</strong><b>{decimals.format(weeklyHigh?.points || 0)} points</b></article>
    </section>

    <section className="analytics-section">
      <div className="analytics-heading"><div><p className="label">FORTUNE MAP</p><h2>Scoring versus<br /><em>schedule.</em></h2></div><p>Higher is better on the scoring axis; further left means a friendlier schedule. Click a franchise to open its record.</p></div>
      <div className="fortune-map" role="img" aria-label="Points for compared with points against">
        <span className="map-y">MORE POINTS FOR ↑</span><span className="map-x">TOUGHER SCHEDULE →</span>
        {report.rows.map((row) => <Link key={row.id} href={`/teams/${row.id}`} className="map-point" style={{ left: `${10 + ((row.pa - paMin) / paRange) * 78}%`, bottom: `${10 + ((row.pf - pfMin) / pfRange) * 74}%` }} title={`${row.name}: ${decimals.format(row.pf)} PF, ${decimals.format(row.pa)} PA`}>
          <b>{row.name.slice(0, 2).toUpperCase()}</b><span>{row.name}</span>
        </Link>)}
      </div>
    </section>

    <section className="analytics-section two-up">
      <div>
        <p className="label">WEEKLY TRAJECTORY</p><h2>Every week<br /><em>counts.</em></h2>
        <label className="chart-picker">Franchise<select value={selectedManager?.id || ""} onChange={(event) => setManagerId(event.target.value)}>{sorted.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.managerName}</option>)}</select></label>
        <div className="weekly-chart" aria-label={`${selectedManager?.name || "Team"} weekly scores`}>
          {weekly.map((item) => <div key={`${item.season}-${item.week}`} title={`${item.season}, week ${item.week}: ${decimals.format(item.points)} points`}><span style={{ height: `${Math.max(5, item.points / maxScore * 100)}%` }} /><small>{item.week}</small></div>)}
        </div>
        <p className="chart-note">{selectedManager?.name} · {decimals.format(selectedManager?.pf || 0)} total PF · {weekly.length} scored weeks</p>
      </div>
      <div className="luck-table"><p className="label">ACTUAL VS. EXPECTED</p><h2>The luck<br /><em>ledger.</em></h2><div>{[...report.rows].sort((a, b) => b.luck - a.luck).map((row) => <Link href={`/teams/${row.id}`} key={row.id}><span>{row.name}</span><b>{row.wins.toFixed(0)} actual</b><small>{decimals.format(row.expectedWins)} expected · <i className={row.luck >= 0 ? "up" : "down"}>{row.luck >= 0 ? "+" : ""}{decimals.format(row.luck)}</i></small></Link>)}</div></div>
    </section>

    <section className="analytics-section report-table"><div className="analytics-heading"><div><p className="label">REPORT BUILDER</p><h2>League<br /><em>table.</em></h2></div><p>Sort-ready reporting lives here next: manager comparisons, playoff filters, and custom date windows will read from the history database.</p></div>
      <div className="table-wrap"><table><thead><tr><th>FRANCHISE</th><th>W-L</th><th>PF</th><th>PA</th><th>ALL-PLAY</th><th>EXPECTED W</th><th>LUCK</th></tr></thead><tbody>{sorted.map((row) => <tr key={row.id}><td><Link className="table-team" href={`/teams/${row.id}`}><strong>{row.name}</strong><small>{row.managerName}</small></Link></td><td>{row.wins}-{row.losses}</td><td>{decimals.format(row.pf)}</td><td>{decimals.format(row.pa)}</td><td>{row.allPlayWins}-{row.allPlayLosses}</td><td>{decimals.format(row.expectedWins)}</td><td className={row.luck >= 0 ? "luck-up" : "luck-down"}>{row.luck >= 0 ? "+" : ""}{decimals.format(row.luck)}</td></tr>)}</tbody></table></div>
    </section>
  </>;
}
