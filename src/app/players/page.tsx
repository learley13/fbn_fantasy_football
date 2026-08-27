import { Nav } from "@/components/Nav";
import { PlayerDirectory } from "@/components/PlayerDirectory";
import { getPlayerDirectory } from "@/lib/sleeper";
export default function PlayersPage() { return <main className="subpage"><Nav /><header className="page-hero"><p className="eyebrow">AOTW PLAYER REFERENCE</p><h1>Players.</h1><p>Search the player universe, then open a league-specific draft, scoring, and transaction history.</p></header><section className="content"><PlayerDirectory players={getPlayerDirectory()} /></section></main>; }
