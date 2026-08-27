import { Nav } from "@/components/Nav";
import { Transactions } from "@/components/Transactions";
import { getTransactionArchive } from "@/lib/sleeper";

export default async function TransactionsPage() {
  const activity = await getTransactionArchive();
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">THE WIRE · 2024—2026</p><h1>Acquisitions.</h1><p>Searchable, filterable league activity—trades, waivers, free agents, and exchanged draft capital.</p></header><section className="content transaction-content"><Transactions activity={activity} /></section></main>;
}
