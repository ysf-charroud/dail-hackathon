import { getDb } from "@/lib/db";
import { currentSession, dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function canAccess(
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

function serialize(db: ReturnType<typeof getDb>, appId: string) {
  const app = db
    .prepare(
      "SELECT id, applicant_name, programme, submitted_at, contact, summary FROM applications WHERE id = ?",
    )
    .get(appId);
  if (!app) return null;
  const evidence = db
    .prepare(
      "SELECT kind, label, status, document_id, file_name, submitted_at, organisation_name, signatory, content, updated_at FROM evidence_items WHERE application_id = ?",
    )
    .all(appId);
  const la = db
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
  const req = db
    .prepare(
      "SELECT message FROM applicant_requests WHERE application_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(appId) as { message: string } | undefined;
  return {
    ...(app as object),
    evidence,
    latestAnalysis: la
      ? {
          ...la,
          issues: JSON.parse(la.issues) as unknown[],
          analyzedAt: la.analyzed_at,
        }
      : null,
    latestRequest: req?.message ?? null,
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
  let db;
  try {
    db = getDb();
  } catch {
    return dbUnavailable();
  }
  if (!canAccess(db, id, session))
    return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ application: serialize(db, id) });
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
  if (!Array.isArray(body.evidence)) {
    return Response.json({ error: "evidence array required" }, { status: 400 });
  }
  let db;
  try {
    db = getDb();
  } catch {
    return dbUnavailable();
  }
  if (!canAccess(db, id, session))
    return Response.json({ error: "Not found" }, { status: 404 });
  const upsert = db.prepare(
    `INSERT INTO evidence_items
      (application_id, kind, label, status, document_id, file_name, submitted_at, organisation_name, signatory, content, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT (application_id, kind) DO UPDATE SET
      label=excluded.label, status=excluded.status, document_id=excluded.document_id,
      file_name=excluded.file_name, submitted_at=excluded.submitted_at,
      organisation_name=excluded.organisation_name, signatory=excluded.signatory,
      content=excluded.content, updated_at=datetime('now')`,
  );
  const tx = db.transaction(
    (items: Record<string, string | null | undefined>[]) => {
      for (const e of items) {
        upsert.run(
          id,
          e.kind,
          e.label,
          e.status,
          e.document_id ?? null,
          e.file_name ?? null,
          e.submitted_at ?? null,
          e.organisation_name ?? null,
          e.signatory ?? null,
          e.content ?? "",
        );
      }
      db.prepare("DELETE FROM analyses WHERE application_id = ?").run(id);
    },
  );
  tx(
    body.evidence as unknown as Record<string, string | null | undefined>[],
  );
  return Response.json({ application: serialize(db, id) });
}
