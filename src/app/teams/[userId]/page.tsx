import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { getLeagueDashboard, getTeamProfile } from "@/lib/sleeper";

export const revalidate = 60;

export async function generateStaticParams() {
  const { managers } = await getLeagueDashboard();
  return managers.map((manager) => ({ userId: manager.id }));
}

export default async function TeamPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const profile = await getTeamProfile(userId);
  if (!profile) notFound();
  const { manager, seasons, activity } = profile;
  const blurb = manager.wins >= manager.losses ? "A franchise that keeps the pressure on." : "Every ledger needs a comeback story.";
  return <main className="subpage"><Nav /><header className="team-hero"><p className="eyebrow">FRANCHISE DOSSIER</p><h1>{manager.name}</h1><p className="username">Manager: {manager.managerName}</p><p>{blurb}</p><div><span><b>{manager.wins}-{manager.losses}</b> career record</span><span><b>{manager.pf.toFixed(1)}</b> points for</span><span><b>{manager.moves}</b> moves</span></div></header><section className="content"><div className="section-heading"><div><p className="eyebrow">SEASON LOG</p><h2>The record</h2></div><p className="quiet">Sleeper-era results<br />beginning in 2024</p></div><div className="table-wrap"><table><thead><tr><th>Season</th><th>Record</th><th>PF</th><th>PA</th><th>Moves</th><th>Transactions</th></tr></thead><tbody>{seasons.map((season) => <tr key={season.season}><td><b>{season.season}</b> <span className="season-status">{season.status.replace("_", " ")}</span></td><td>{season.wins}-{season.losses}{season.ties ? `-${season.ties}` : ""}</td><td>{season.pf.toFixed(1)}</td><td>{season.pa.toFixed(1)}</td><td>{season.moves}</td><td>{season.transactions}</td></tr>)}</tbody></table></div><div className="team-activity"><div className="section-heading"><div><p className="eyebrow">ACTIVITY LEDGER</p><h2>Every move</h2></div><p className="quiet">{activity.length} recorded moves<br />trades, pickups, and drops</p></div><div>{activity.map((item) => <article key={item.id}><time>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(item.created)}</time>{item.type === "trade" ? <Link className="type trade" href={`/trades/${item.id}`}>Trade receipt →</Link> : <span className={`type ${item.type}`}>{item.type.replace("_", " ")}</span>}<div>{item.teams.filter((team) => team.id !== userId).map((team) => <Link href={`/teams/${team.id}`} key={team.id}>{team.name}</Link>)}<p>{item.players?.map((player) => player.name).join(" · ") || "No player movement recorded"}</p>{item.draftPicks?.map((pick) => <span className="draft-pick-pill" key={pick}>{pick}</span>)}</div></article>)}</div></div></section></main>;
}
