import { Nav } from "@/components/Nav";
import { Transactions } from "@/components/Transactions";
import { TradeCards } from "@/components/TradeCards";
import { getTradeAnalysis, getTransactionArchive } from "@/lib/sleeper";

export default async function TransactionsPage() {
  const [activity, trades] = await Promise.all([getTransactionArchive(), getTradeAnalysis()]);
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">THE WIRE · 2024—2026</p><h1>Acquisitions.</h1><p>Trades are evaluated by actual post-trade fantasy points. Draft picks remain explicitly unrealized until they produce points.</p></header><section className="content transaction-content"><TradeCards trades={trades} /><Transactions activity={activity.filter((item) => item.type !== "trade")} /></section></main>;
}
