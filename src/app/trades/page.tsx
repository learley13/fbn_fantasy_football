import Link from "next/link";
import { Nav } from "@/components/Nav";
import { getTradeLedger } from "@/lib/sleeper";

const date = (value: number) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value);

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const trades = await getTradeLedger();
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">ASSET HISTORY</p><h1>Trade<br /><em>Ledger.</em></h1><p>Every deal as a receipt: who received what, the path of every pick, and realized player production.</p></header><section className="content"><div className="trade-ledger">{trades.map((trade) => <Link href={`/trades/${trade.id}`} key={trade.id}><span>{trade.season} · {date(trade.created)}</span><div>{trade.sides.map((side) => <strong key={side.team.id}>{side.team.name}<small>Manager: {side.team.managerName}</small></strong>)}</div><b>View receipt →</b></Link>)}</div></section></main>;
}
