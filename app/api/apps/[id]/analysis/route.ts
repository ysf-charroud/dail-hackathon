import { getDb } from "@/lib/db";
import { currentSession, dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function canWrite(
  db: ReturnType<typeof getDb>,
  appId: string,
  session: NonNullable<Awaited<ReturnType<typeof currentSession>>>,
): boolean {
  if (session.role === "reviewer") {
    return Boolean(
      db.prepare("SELECT 1 FROM applications WHERE id = ?").get(appId),
    );
  }
  return Boolean(
    db
      .prepare("SELECT 1 FROM applications WHERE id = ? AND owner_id = ?")
      .get(appId, session.userId),
  );
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
    db = getDb();
  } catch {
    return dbUnavailable();
  }
  if (!canWrite(db, id, session))
    return Response.json({ error: "Not found" }, { status: 404 });
  db.prepare(
    "INSERT INTO analyses (application_id, status, summary, issues, source, analyzed_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    body.status,
    body.summary,
    JSON.stringify(body.issues),
    body.source,
    body.analyzedAt ?? new Date().toISOString(),
    session.userId,
  );
  return Response.json({ ok: true });
}
