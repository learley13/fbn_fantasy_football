import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getPlayerReference } from "@/lib/sleeper";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const player = await getPlayerReference(playerId);
  if (!player) notFound();
  return <main className="subpage"><Nav /><header className="player-hero"><Image src={`https://sleepercdn.com/content/nfl/players/thumb/${player.id}.jpg`} alt="" width={112} height={112} unoptimized /><div><p className="eyebrow">AOTW PLAYER REFERENCE</p><h1>{player.name}</h1><p>{player.position} · {player.team} · {player.points.toFixed(1)} AOTW PF</p></div></header><section className="content"><section className="player-blurb"><p className="label">LEAGUE BLURB</p><p>{player.blurb}</p><small>Generated from current Sleeper draft, transaction, and scoring records.</small></section><div className="two-up"><div><p className="label">DRAFT PEDIGREE</p><h2>Draft<br /><em>history.</em></h2>{player.drafts.length ? player.drafts.map((draft) => <Link className="player-row" href={`/teams/${draft.team.id}`} key={`${draft.season}-${draft.pickNo}`}><span>{draft.season} · {draft.round}.{draft.pickNo}</span><strong>{draft.team.name}<small>{draft.team.managerName}</small></strong></Link>) : <p>No AOTW draft record.</p>}</div><div><p className="label">LEAGUE MOVEMENT</p><h2>Asset<br /><em>trail.</em></h2>{player.activity.map((item) => <div className="player-row" key={item.id}><span>{item.season} · {item.type.replace("_", " ")}</span><strong>{item.teams.map((team) => <Link href={`/teams/${team.id}`} key={team.id}>{team.name} </Link>)}</strong>{item.type === "trade" && <Link href={`/trades/${item.id}`}>View trade receipt →</Link>}</div>)}</div></div><section className="player-game-log"><p className="label">AOTW GAME LOG</p><h2>Points by<br /><em>week.</em></h2><div className="table-wrap"><table><thead><tr><th>SEASON</th><th>WEEK</th><th>FRANCHISE</th><th>PF</th></tr></thead><tbody>{player.weekly.map((week) => <tr key={`${week.season}-${week.week}-${week.team.id}`}><td>{week.season}</td><td>{week.week}</td><td><Link className="table-team" href={`/teams/${week.team.id}`}><strong>{week.team.name}</strong><small>{week.team.managerName}</small></Link></td><td>{week.points.toFixed(1)}</td></tr>)}</tbody></table></div></section></section></main>;
}
