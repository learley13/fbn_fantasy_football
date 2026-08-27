import { getLeagueDashboard } from "@/lib/sleeper";
import { Nav } from "@/components/Nav";
import { TeamLink } from "@/components/TeamLink";

function number(value: number) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value); }
function date(value: number) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value); }

export default async function Home() {
  const { records, managers, power, activity } = await getLeagueDashboard();
  const current = records[0];
  const lastSeason = records[1];
  const allTimePf = managers[0];
  const allTimeWins = [...managers].sort((a, b) => b.wins - a.wins)[0];
  const moveLeader = [...managers].sort((a, b) => b.moves - a.moves)[0];

  return <main>
    <section className="hero">
      <Nav />
      <div className="hero-content">
        <p className="eyebrow">EST. 2024 · THE OFFICIAL LEAGUE ARCHIVE</p>
        <h1>Alumni on<br /><em>the Warpath.</em></h1>
        <p className="lede">The living record book for a league with receipts.</p>
      </div>
      <div className="season-chip"><span>2026 SEASON</span><strong>{current.league.status.replace("_", " ")}</strong></div>
    </section>

    <section className="content">
      <div className="section-heading"><div><p className="eyebrow">THE PULSE</p><h2>League at a glance</h2></div><p className="quiet">Data refreshes every minute<br />from Sleeper</p></div>
      <div className="story-grid">
        <article className="feature-card"><p className="label">UP NEXT</p><h3>2026<br />Draft Room</h3><p>{current.league.status === "pre_draft" ? "The board is quiet. The group chat will not be." : "Live season coverage is underway."}</p><div className="rule" /><span>12 managers · 6 playoff spots</span></article>
        <article className="metric-card"><p className="label">ALL-TIME POINTS FOR</p><strong>{number(allTimePf.pf)}</strong><span>{allTimePf.name}</span></article>
        <article className="metric-card"><p className="label">ALL-TIME WINS</p><strong>{allTimeWins.wins}</strong><span>{allTimeWins.name}</span></article>
        <article className="metric-card red"><p className="label">MOST ACTIVE</p><strong>{moveLeader.moves}</strong><span>{moveLeader.name} · transactions</span></article>
      </div>

      <div className="two-column">
        <section><div className="section-heading compact"><div><p className="eyebrow">THE INDEX</p><h2>Power rankings</h2></div><span className="formula">2025 PF + all-time record</span></div>
          <div className="ranking-list">{power.slice(0, 8).map((manager, index) => <div className="rank" key={manager.id}><b>{String(index + 1).padStart(2, "0")}</b><TeamLink manager={manager} compact /><span>{number((manager.latestPf || manager.pf / manager.seasons) + (manager.wins - manager.losses) * 25)}</span></div>)}</div>
        </section>
        <section><div className="section-heading compact"><div><p className="eyebrow">THE WIRE</p><h2>Recent acquisitions</h2></div><span className="formula">{activity.length} recorded moves</span></div>
          <div className="activity-list">{activity.slice(0, 6).map((item) => <div className="activity" key={item.id}><span className={`type ${item.type}`}>{item.type.replace("_", " ")}</span><div><strong>{item.teams.map((team) => team.name).join(" × ")}</strong><small>{item.adds ? `${item.adds} add${item.adds > 1 ? "s" : ""}` : ""}{item.adds && item.drops ? " · " : ""}{item.drops ? `${item.drops} drop${item.drops > 1 ? "s" : ""}` : ""}{item.bid ? ` · $${item.bid} FAAB` : ""}</small></div><time>{date(item.created)}</time></div>)}</div>
        </section>
      </div>

      <section className="archive"><div className="section-heading"><div><p className="eyebrow">THE ARCHIVE</p><h2>Every season leaves a mark.</h2></div><p className="quiet">Sleeper-native history<br />back to 2024</p></div><div className="season-grid">{records.map((record) => <article key={record.id}><p>{record.season} SEASON</p><h3>{record.season === 2026 ? "On deck" : record.league.status}</h3><span>{record.rosters.length} teams · {record.transactions.length} completed moves</span></article>)}</div></section>

      <section className="record-book"><div><p className="eyebrow">COMING THROUGH THE TUNNEL</p><h2>Record book.<br /><em>Rivalries.</em><br />Trophy room.</h2></div><p>This is the first page of the archive. The next chapters turn every matchup, draft pick, transaction, championship and heartbreak into permanent league lore.</p></section>
    </section>
    <footer>ALUMNI ON THE WARPATH · LEAGUE LEDGER <span>2024—2026</span></footer>
  </main>;
}
