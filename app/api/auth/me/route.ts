import { getDb } from "@/lib/db";
import { currentSession, dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Not signed in" }, { status: 401 });
  let db;
  try {
    db = await getDb();
  } catch {
    return dbUnavailable();
  }
  const [row] = await db.query(
    "SELECT id::int, email, role, display_name FROM users WHERE id = $1",
    [session.userId],
  );
  if (!row) return Response.json({ error: "Not signed in" }, { status: 401 });
  return Response.json({ user: row });
}
