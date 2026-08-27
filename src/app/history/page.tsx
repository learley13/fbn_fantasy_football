import { Nav } from "@/components/Nav";
import { HistoryTable } from "@/components/HistoryTable";
import { getHistoryReport } from "@/lib/sleeper";

export default async function HistoryPage() {
  const report = await getHistoryReport();
  return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">2024—PRESENT</p><h1>All-Time<br /><em>Stats.</em></h1><p>Filter to a season, then sort the league by the metric you care about.</p></header><section className="content"><HistoryTable seasons={report.seasons} rows={report.rows} /></section></main>;
}
