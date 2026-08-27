import Link from "next/link";

const links = [
  ["/", "Home"],
  ["/analytics", "Analytics"],
  ["/teams", "Teams"],
  ["/players", "Players"],
  ["/transactions", "Transactions"],
  ["/drafts", "Drafts"]
] as const;

export function Nav({ showLinks = true }: { showLinks?: boolean }) {
  return <nav className="site-nav"><Link className="wordmark" href="/">AOTW <i>•</i> LEDGER</Link>{showLinks && <div>{links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</div>}<span className="status"><b /> SLEEPER LIVE</span></nav>;
}
