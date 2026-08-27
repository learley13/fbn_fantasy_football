import { Nav } from "@/components/Nav";
import { TeamLink } from "@/components/TeamLink";
import { getLeagueDashboard } from "@/lib/sleeper";

export default async function PowerRankingsPage() {
  const { power } = await getLeagueDashboard();
  const standings = [...power].sort((a, b) => b.pf - a.pf);
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">ALL-TIME LEADERBOARD</p><h1>Points<br /><em>for.</em></h1><p>Sorted by all-time PF. Points against is included because the schedule is part of the story too.</p></header>
    <section className="content"><div className="full-rankings">{standings.map((manager, index) => <article key={manager.id}><b>{String(index + 1).padStart(2, "0")}</b><div><TeamLink manager={manager} /><p>{manager.wins}-{manager.losses}{manager.ties ? `-${manager.ties}` : ""} career record · {manager.seasons} seasons</p></div><strong>{manager.pf.toFixed(1)}<small>PF · {manager.pa.toFixed(1)} PA</small></strong></article>)}</div>
    </section></main>;
}
