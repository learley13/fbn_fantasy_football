import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { DraftPicker } from "@/components/DraftPicker";
import { getDraftArchive } from "@/lib/sleeper";

export const dynamic = "force-dynamic";

export default async function DraftsPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const drafts = await getDraftArchive();
  const { season } = await searchParams;
  const draft = drafts.find((item) => String(item.season) === season) || drafts[0];
  if (!draft) return null;
  const slots = Array.from({ length: 12 }, (_, index) => index + 1);
  const rounds = Array.from({ length: draft.rounds }, (_, index) => index + 1);
  const pickFor = (round: number, slot: number) => draft.picks.find((pick) => pick.round === round && pick.pickNo === (round - 1) * 12 + slot);
  const managerFor = (slot: number) => draft.picks.find((pick) => pick.pickNo === slot)?.owner;
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">DRAFT ARCHIVE</p><h1>The draft<br /><em>room.</em></h1><p>Browse each board as it happened. Traded picks carry their original owner and a visible path to the manager who made the selection.</p></header><section className="content"><div className="section-heading"><div><p className="eyebrow">{draft.season} DRAFT</p><h2>Draft board</h2></div><DraftPicker seasons={drafts.map((item) => Number(item.season))} /></div><div className="draft-room-scroll"><div className="draft-room"><div className="draft-corner">ROUND</div>{slots.map((slot) => { const manager = managerFor(slot); return <Link className="draft-manager" href={`/teams/${manager?.id}`} key={slot}><b>{manager?.name.slice(0, 2).toUpperCase()}</b><strong>{manager?.name || `Slot ${slot}`}</strong><small>{manager?.managerName}</small></Link>; })}{rounds.map((round) => <div className="draft-round" key={round}><div className="round-marker">R{round}</div>{slots.map((slot) => { const pick = pickFor(round, slot); if (!pick) return <div className="draft-cell empty" key={`${round}-${slot}`}><small>{round}.{slot}</small></div>; return <article className={`draft-cell${pick.traded ? " traded" : ""}`} key={pick.pickNo}><small>{round}.{slot}</small>{pick.traded && <span className="traded-badge" title={`Originally held by ${pick.originalOwner?.name}`}>↗ From {pick.originalOwner?.name}</span>}<Image src={`https://sleepercdn.com/content/nfl/players/thumb/${pick.playerId}.jpg`} alt="" width={34} height={34} unoptimized /><strong>{pick.playerName}</strong><em>{pick.position} · {pick.team}</em><Link href={`/teams/${pick.owner.id}`}>Picked by {pick.owner.name}</Link></article>; })}</div>)}</div></div></section></main>;
}
