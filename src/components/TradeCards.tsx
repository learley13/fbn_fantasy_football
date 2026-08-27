import Link from "next/link";
import Image from "next/image";
import type { TradeAnalysis } from "@/lib/sleeper";

const date = (value: number) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value);

export function TradeCards({ trades }: { trades: TradeAnalysis[] }) {
  return <section className="trade-section"><h2>Trade evaluator</h2>{trades.map((trade) => <article className="trade-card" key={trade.id}><header><span>{trade.season} · {date(trade.created)}</span><strong>Post-trade PF</strong></header><div className="trade-sides">{trade.sides.map((side) => <div className="trade-side" key={side.team.id}><Link href={`/teams/${side.team.id}`}><strong>{side.team.name}</strong><small>Manager: {side.team.managerName}</small></Link><div className="trade-assets">{side.players.map((player) => <div className="trade-player" key={player.id}><Image src={`https://sleepercdn.com/content/nfl/players/thumb/${player.id}.jpg`} alt="" width={28} height={28} unoptimized /><span>{player.name}</span><small>{player.position} · {player.team}</small></div>)}{side.draftPicks.map((pick) => <div className="unrealized" key={pick}>Draft pick not yet realized · {pick}</div>)}</div><div className={`trade-score ${side.delta > 0 ? "positive" : side.delta < 0 ? "negative" : "neutral"}`}><strong>{side.delta > 0 ? "+" : ""}{side.delta.toFixed(1)} PF</strong><small>{side.pf.toFixed(1)} PF from acquired players</small></div></div>)}</div></article>)}</section>;
}
