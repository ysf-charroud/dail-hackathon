import { getDb } from "@/lib/db";
import { currentSession, dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

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
  let body: { message?: string; source?: "llm" | "deterministic" };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body.message || (body.source !== "llm" && body.source !== "deterministic")) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  let db;
  try {
    db = await getDb();
  } catch {
    return dbUnavailable();
  }
  const [application] = await db.query(
    "SELECT 1 FROM applications WHERE id = $1",
    [id],
  );
  if (!application) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await db.query(
    `INSERT INTO applicant_requests
      (application_id, message, source, created_by) VALUES ($1, $2, $3, $4)`,
    [id, body.message, body.source, session.userId],
  );
  return Response.json({ ok: true });
}
