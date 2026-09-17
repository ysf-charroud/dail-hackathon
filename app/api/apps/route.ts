import { getDb } from "@/lib/db";
import { currentSession, dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function latestAnalysis(
  db: ReturnType<typeof getDb>,
  appId: string,
) {
  return db
    .prepare(
      "SELECT status, summary, issues, source, analyzed_at FROM analyses WHERE application_id = ? ORDER BY analyzed_at DESC LIMIT 1",
    )
    .get(appId) as
    | {
        status: string;
        summary: string;
        issues: string;
        source: "llm" | "deterministic";
        analyzed_at: string;
      }
    | undefined;
}

export async function GET() {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Not signed in" }, { status: 401 });
  let db;
  try {
    db = getDb();
  } catch {
    return dbUnavailable();
  }
  const apps =
    session.role === "reviewer"
      ? db
          .prepare(
            "SELECT id, applicant_name, programme, submitted_at, contact, summary FROM applications ORDER BY id",
          )
          .all()
      : db
          .prepare(
            "SELECT id, applicant_name, programme, submitted_at, contact, summary FROM applications WHERE owner_id = ? ORDER BY id",
          )
          .all(session.userId);
  const evStmt = db.prepare(
    "SELECT kind, label, status, document_id, file_name, submitted_at, organisation_name, signatory, content, updated_at FROM evidence_items WHERE application_id = ?",
  );
  const out = (apps as { id: string }[]).map((a) => {
    const evidence = evStmt.all(a.id);
    const la = latestAnalysis(db, a.id);
    return {
      ...a,
      evidence,
      latestAnalysis: la
        ? {
            ...la,
            issues: JSON.parse(la.issues) as unknown[],
            analyzedAt: la.analyzed_at,
          }
        : null,
    };
  });
  return Response.json({ applications: out });
}
