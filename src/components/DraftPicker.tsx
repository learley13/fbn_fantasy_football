"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DraftPicker({ seasons }: { seasons: number[] }) {
  const router = useRouter();
  const params = useSearchParams();
  return <label className="picker">Draft year<select value={params.get("season") || String(seasons[0])} onChange={(event) => router.push(`/drafts?season=${event.target.value}`)}>{seasons.map((season) => <option key={season} value={season}>{season}</option>)}</select></label>;
}
