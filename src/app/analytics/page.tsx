import { AnalyticsHub } from "@/components/AnalyticsHub";
import { Nav } from "@/components/Nav";
import { getAnalyticsHub } from "@/lib/sleeper";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { reports } = await getAnalyticsHub();
  return <main className="subpage"><Nav /><header className="page-hero analytics-hero"><p className="eyebrow">LEAGUE INTELLIGENCE</p><h1>Analytics<br /><em>Hub.</em></h1><p>Scoring, schedule, and the receipts behind every record. Built from the league’s weekly results—not projections.</p></header><section className="content"><AnalyticsHub reports={reports} /></section></main>;
}
