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
    db = getDb();
  } catch {
    return dbUnavailable();
  }
  if (!db.prepare("SELECT 1 FROM applications WHERE id = ?").get(id)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  db.prepare(
    "INSERT INTO applicant_requests (application_id, message, source, created_by) VALUES (?, ?, ?, ?)",
  ).run(id, body.message, body.source, session.userId);
  return Response.json({ ok: true });
}
