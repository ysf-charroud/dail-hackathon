import { getDb, type Db } from "@/lib/db";
import { currentSession, dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

type Session = NonNullable<Awaited<ReturnType<typeof currentSession>>>;

async function canAccess(db: Db, appId: string, session: Session) {
  const [row] = await db.query(
    `SELECT 1 FROM applications
     WHERE id = $1 AND ($2::text = 'reviewer' OR owner_id = $3)`,
    [appId, session.role, session.userId],
  );
  return Boolean(row);
}

async function serialize(db: Db, appId: string) {
  const [[app], evidence, [analysis], [request]] = await Promise.all([
    db.query(
      `SELECT id, applicant_name, programme, submitted_at, contact, summary,
              theme, country, purpose, target_group
       FROM applications WHERE id = $1`,
      [appId],
    ),
    db.query(
      `SELECT kind, label, status, document_id, file_name, submitted_at,
              organisation_name, signatory, content, updated_at
       FROM evidence_items WHERE application_id = $1 ORDER BY id`,
      [appId],
    ),
    db.query(
      `SELECT status, summary, issues, source, analyzed_at
       FROM analyses WHERE application_id = $1
       ORDER BY analyzed_at DESC, id DESC LIMIT 1`,
      [appId],
    ),
    db.query(
      `SELECT message FROM applicant_requests WHERE application_id = $1
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [appId],
    ),
  ]);
  if (!app) return null;
  return {
    ...app,
    evidence,
    latestAnalysis: analysis
      ? {
          status: analysis.status,
          summary: analysis.summary,
          issues: analysis.issues,
          source: analysis.source,
          analyzedAt: analysis.analyzed_at,
        }
      : null,
    latestRequest: request?.message ?? null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  try {
    const db = await getDb();
    if (!(await canAccess(db, id, session)))
      return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ application: await serialize(db, id) });
  } catch {
    return dbUnavailable();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  let body: { evidence?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!Array.isArray(body.evidence))
    return Response.json({ error: "evidence array required" }, { status: 400 });

  try {
    const db = await getDb();
    if (!(await canAccess(db, id, session)))
      return Response.json({ error: "Not found" }, { status: 404 });
    const items = body.evidence as Record<string, string | null | undefined>[];
    await db.transaction((tx) => [
      ...items.map((e) =>
        tx.query(
          `INSERT INTO evidence_items
            (application_id, kind, label, status, document_id, file_name,
             submitted_at, organisation_name, signatory, content, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
           ON CONFLICT (application_id, kind) DO UPDATE SET
             label = EXCLUDED.label, status = EXCLUDED.status,
             document_id = EXCLUDED.document_id, file_name = EXCLUDED.file_name,
             submitted_at = EXCLUDED.submitted_at,
             organisation_name = EXCLUDED.organisation_name,
             signatory = EXCLUDED.signatory, content = EXCLUDED.content,
             updated_at = now()`,
          [id, e.kind, e.label, e.status, e.document_id ?? null,
            e.file_name ?? null, e.submitted_at ?? null,
            e.organisation_name ?? null, e.signatory ?? null, e.content ?? ""],
        ),
      ),
      tx.query("DELETE FROM analyses WHERE application_id = $1", [id]),
    ]);
    return Response.json({ application: await serialize(db, id) });
  } catch {
    return dbUnavailable();
  }
}
