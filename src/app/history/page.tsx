import { Nav } from "@/components/Nav";
import { getLeagueDashboard } from "@/lib/sleeper";
import { TeamLink } from "@/components/TeamLink";

const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);

export default async function HistoryPage() {
  const { managers, records } = await getLeagueDashboard();
  const wins = [...managers].sort((a, b) => b.wins - a.wins)[0];
  const points = [...managers].sort((a, b) => b.pf - a.pf)[0];
  const moves = [...managers].sort((a, b) => b.moves - a.moves)[0];
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">2024—2026 · THE ARCHIVE</p><h1>The league<br /><em>remembers.</em></h1><p>Every finish, point, win and waiver move in one permanent record.</p></header>
    <section className="content history-content"><div className="record-strips"><article><span>MOST WINS</span><strong>{wins.wins}</strong><p>{wins.name}</p></article><article><span>MOST POINTS FOR</span><strong>{number(points.pf)}</strong><p>{points.name}</p></article><article><span>MOST MOVES</span><strong>{moves.moves}</strong><p>{moves.name}</p></article></div>
      <div className="section-heading"><div><p className="eyebrow">ALL-TIME TABLE</p><h2>Career leaders</h2></div><p className="quiet">Regular-season totals<br />across Sleeper history</p></div>
      <div className="table-wrap"><table><thead><tr><th>Manager</th><th>Seasons</th><th>Record</th><th>PF</th><th>PA</th><th>Moves</th></tr></thead><tbody>{managers.map((manager, index) => <tr key={manager.id}><td><b>{String(index + 1).padStart(2, "0")}</b><TeamLink manager={manager} compact /></td><td>{manager.seasons}</td><td>{manager.wins}-{manager.losses}{manager.ties ? `-${manager.ties}` : ""}</td><td>{number(manager.pf)}</td><td>{number(manager.pa)}</td><td>{manager.moves}</td></tr>)}</tbody></table></div>
      <div className="section-heading seasons-title"><div><p className="eyebrow">SEASON VAULT</p><h2>Year by year</h2></div></div><div className="season-grid">{records.map((record) => <article key={record.id}><p>{record.season} SEASON</p><h3>{record.league.status.replace("_", " ")}</h3><span>{record.rosters.length} teams · {record.transactions.length} completed moves</span></article>)}</div>
    </section></main>;
}
