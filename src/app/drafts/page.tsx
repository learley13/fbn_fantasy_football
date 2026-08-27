import Image from "next/image";
import { Nav } from "@/components/Nav";
import { DraftPicker } from "@/components/DraftPicker";
import { getDraftArchive } from "@/lib/sleeper";

export default async function DraftsPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const drafts = await getDraftArchive();
  const { season } = await searchParams;
  const draft = drafts.find((item) => String(item.season) === season) || drafts[0];
  if (!draft) return null;
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">DRAFT ARCHIVE</p><h1>Every pick.<br /><em>Every receipt.</em></h1><p>Draft boards preserve the original owner and flag picks that changed hands.</p></header><section className="content"><div className="section-heading"><div><p className="eyebrow">{draft.season} DRAFT</p><h2>Draft board</h2></div><DraftPicker seasons={drafts.map((item) => Number(item.season))} /></div><div className="draft-board">{draft.picks.map((pick) => <article key={pick.pickNo} className={pick.traded ? "traded" : ""}><span className="pick-number">{pick.round}.{String(((pick.pickNo - 1) % 12) + 1).padStart(2, "0")}</span><Image src={`https://sleepercdn.com/content/nfl/players/thumb/${pick.playerId}.jpg`} alt="" width={34} height={34} unoptimized /><div><strong>{pick.playerName}</strong><small>{pick.position} · {pick.team}</small></div><div className="draft-owner"><strong>{pick.owner.name}</strong><small>Manager: {pick.owner.managerName}</small>{pick.traded && <span title={`Originally ${pick.originalOwner?.name}`}>↗ Traded from {pick.originalOwner?.name}</span>}</div></article>)}</div></section></main>;
}
