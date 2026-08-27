import { Nav } from "@/components/Nav";
import { TeamLink } from "@/components/TeamLink";
import { getLeagueDashboard } from "@/lib/sleeper";

export default async function TeamsPage() {
  const { managers } = await getLeagueDashboard();
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">FRANCHISE DIRECTORY</p><h1>Twelve teams.<br /><em>One ledger.</em></h1><p>Choose a franchise to view its full Sleeper-era dossier: career results, points, season history, and activity.</p></header><section className="content"><div className="team-directory">{managers.map((manager, index) => <article key={manager.id}><b>{String(index + 1).padStart(2, "0")}</b><TeamLink manager={manager} /><span>{manager.wins}-{manager.losses} · {manager.pf.toFixed(1)} PF</span></article>)}</div></section></main>;
}
