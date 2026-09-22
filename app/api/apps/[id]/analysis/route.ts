import { getDb, type Db } from "@/lib/db";
import { currentSession, dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

async function canWrite(
  db: Db,
  appId: string,
  session: NonNullable<Awaited<ReturnType<typeof currentSession>>>,
): Promise<boolean> {
  const [row] = await db.query(
    `SELECT 1 FROM applications
     WHERE id = $1 AND ($2::text = 'reviewer' OR owner_id = $3)`,
    [appId, session.role, session.userId],
  );
  return Boolean(row);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Not signed in" }, { status: 401 });
  if (session.role !== "reviewer")
    return Response.json({ error: "Reviewers only" }, { status: 403 });
  const { id } = await params;
  let body: {
    status?: string;
    summary?: string;
    issues?: unknown[];
    source?: "llm" | "deterministic";
    analyzedAt?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (
    !body.status ||
    !body.summary ||
    !Array.isArray(body.issues) ||
    (body.source !== "llm" && body.source !== "deterministic")
  ) {
    return Response.json({ error: "Invalid analysis" }, { status: 400 });
  }
  let db;
  try {
    db = await getDb();
  } catch {
    return dbUnavailable();
  }
  if (!(await canWrite(db, id, session)))
    return Response.json({ error: "Not found" }, { status: 404 });
  await db.query(
    `INSERT INTO analyses
      (application_id, status, summary, issues, source, analyzed_at, created_by)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
    [id, body.status, body.summary, JSON.stringify(body.issues), body.source,
      body.analyzedAt ?? new Date().toISOString(), session.userId],
  );
  return Response.json({ ok: true });
}
