import Link from "next/link";
import type { ManagerTotal } from "@/lib/sleeper";

export function TeamLink({ manager, compact = false }: { manager: ManagerTotal; compact?: boolean }) {
  return <Link className={`team-link${compact ? " compact" : ""}`} href={`/teams/${manager.id}`}><strong>{manager.name}</strong><small>Manager: {manager.managerName}</small></Link>;
}
