import Link from "next/link";

const links = [
  ["/", "Home"],
  ["/teams", "Teams"],
  ["/power-rankings", "Rankings"],
  ["/transactions", "Acquisitions"],
  ["/drafts", "Drafts"],
  ["/history", "All-Time Stats"]
] as const;

export function Nav() {
  return <nav className="site-nav"><Link className="wordmark" href="/">AOTW <i>•</i> LEDGER</Link><div>{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</div><span className="status"><b /> SLEEPER LIVE</span></nav>;
}
