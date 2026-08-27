import Link from "next/link";
import { Nav } from "@/components/Nav";

const destinations = [
  ["/analytics", "Analytics Hub", "Scoring, schedule, and the luck ledger"],
  ["/teams", "Teams", "Franchise profiles and season logs"],
  ["/history", "All-Time Stats", "Sortable league history by year"],
  ["/power-rankings", "Rankings", "Points for and points against"],
  ["/transactions", "Acquisitions", "Trades, waivers, and activity leaders"],
  ["/drafts", "Drafts", "Historical boards and traded picks"]
];

export default function Home() {
  return <main><section className="hero home-hero"><Nav /><div className="hero-content"><p className="eyebrow">ALUMNI ON THE WARPATH · SLEEPER ERA</p><h1>Alumni on<br /><em>the Warpath.</em></h1></div><div className="home-links">{destinations.map(([href, label, detail]) => <Link href={href} key={href}><strong>{label}</strong><span>{detail}</span><b>→</b></Link>)}</div></section></main>;
}
