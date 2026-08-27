import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getTradeLedger } from "@/lib/sleeper";

export const dynamic = "force-dynamic";

export default async function TradeDetailPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = await params;
  const trade = (await getTradeLedger()).find((item) => item.id === tradeId);
  if (!trade) notFound();
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">TRADE RECEIPT · {trade.season}</p><h1>Asset<br /><em>lineage.</em></h1><p><Link href="/trades">← Back to Trade Ledger</Link></p></header><section className="content"><div className="receipt-grid">{trade.sides.map((side) => <article key={side.team.id}><Link className="receipt-team" href={`/teams/${side.team.id}`}><strong>{side.team.name}</strong><small>Manager: {side.team.managerName}</small></Link><p className="label">RECEIVED</p><div className="receipt-assets">{side.players.map((player) => <div className="receipt-player" key={player.id}><Image src={`https://sleepercdn.com/content/nfl/players/thumb/${player.id}.jpg`} alt="" width={34} height={34} unoptimized /><span>{player.name}<small>{player.position} · {player.team}</small></span></div>)}{side.picks.map((pick) => <div className="receipt-pick" key={pick.label}><span>{pick.label}</span>{pick.realized ? <b>→ {pick.realized.name}<small>{pick.realized.position} · {pick.realized.team}</small></b> : <small>Not yet realized</small>}</div>)}</div><div className="receipt-impact"><span>Realized PF from direct player assets</span><strong>{side.pf.toFixed(1)} PF</strong><small className={side.delta >= 0 ? "luck-up" : "luck-down"}>{side.delta >= 0 ? "+" : ""}{side.delta.toFixed(1)} PF vs. other side</small></div></article>)}</div></section></main>;
}
