import { getDb } from "@/lib/db";
import { currentSession, dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await currentSession();
  if (!session)
    return Response.json({ error: "Not signed in" }, { status: 401 });

  try {
    const db = await getDb();
    const apps = await db.query(
      `SELECT id, applicant_name, programme, submitted_at, contact, summary,
              theme, country, purpose, target_group
       FROM applications
       WHERE ($1::text = 'reviewer' OR owner_id = $2)
       ORDER BY id`,
      [session.role, session.userId],
    );
    const ids = apps.map((app) => app.id as string);
    const evidence = ids.length
      ? await db.query(
          `SELECT application_id, kind, label, status, document_id, file_name,
                  submitted_at, organisation_name, signatory, content, updated_at
           FROM evidence_items WHERE application_id = ANY($1::text[])
           ORDER BY id`,
          [ids],
        )
      : [];
    const analyses = ids.length
      ? await db.query(
          `SELECT DISTINCT ON (application_id) application_id, status, summary,
                  issues, source, analyzed_at
           FROM analyses WHERE application_id = ANY($1::text[])
           ORDER BY application_id, analyzed_at DESC, id DESC`,
          [ids],
        )
      : [];

    return Response.json({
      applications: apps.map((app) => {
        const latest = analyses.find((item) => item.application_id === app.id);
        return {
          ...app,
          evidence: evidence.filter((item) => item.application_id === app.id),
          latestAnalysis: latest
            ? {
                status: latest.status,
                summary: latest.summary,
                issues: latest.issues,
                source: latest.source,
                analyzedAt: latest.analyzed_at,
              }
            : null,
        };
      }),
    });
  } catch {
    return dbUnavailable();
  }
}
