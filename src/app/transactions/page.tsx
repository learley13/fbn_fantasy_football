import { Nav } from "@/components/Nav";
import { Transactions } from "@/components/Transactions";
import { getTransactionArchive } from "@/lib/sleeper";

export default async function TransactionsPage() {
  const activity = await getTransactionArchive();
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">THE WIRE · 2024—2026</p><h1>Every move<br /><em>has a receipt.</em></h1><p>Trades, waivers, free agents, drops, and FAAB—searchable across the league&apos;s Sleeper history.</p></header><section className="content transaction-content"><Transactions activity={activity} /></section></main>;
}
