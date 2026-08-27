import { hasDatabase } from "@/lib/database";
import { syncSleeperHistory } from "@/lib/league-sync";

export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!hasDatabase()) return Response.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await syncSleeperHistory());
  } catch (error) {
    console.error("Sleeper sync failed", error);
    return Response.json({ error: "Sleeper sync failed." }, { status: 500 });
  }
}
