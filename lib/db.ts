import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { SEED_APPLICATIONS } from "./data";
import { hashPasswordSync } from "./password";

export type Db = NeonQueryFunction<false, false>;

let sql: Db | null = null;
let initialization: Promise<void> | null = null;

function databaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is required");
  return value;
}

export async function getDb(): Promise<Db> {
  if (!sql) sql = neon(databaseUrl());
  initialization ??= initialize(sql).catch((error) => {
    initialization = null;
    throw error;
  });
  await initialization;
  return sql;
}

async function initialize(db: Db): Promise<void> {
  await db.transaction((tx) => [
    tx.query(`CREATE TABLE IF NOT EXISTS users (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('reviewer', 'applicant')),
      display_name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`),
    tx.query(`CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicant_name TEXT NOT NULL,
      programme TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      owner_id BIGINT REFERENCES users(id),
      theme TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      purpose TEXT NOT NULL DEFAULT '',
      target_group TEXT NOT NULL DEFAULT ''
    )`),
    tx.query(`CREATE TABLE IF NOT EXISTS evidence_items (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('provided', 'missing')),
      document_id TEXT,
      file_name TEXT,
      submitted_at TIMESTAMPTZ,
      organisation_name TEXT,
      signatory TEXT,
      content TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (application_id, kind)
    )`),
    tx.query(`CREATE TABLE IF NOT EXISTS analyses (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('missing_evidence', 'needs_clarification', 'review_ready')),
      summary TEXT NOT NULL,
      issues JSONB NOT NULL DEFAULT '[]'::jsonb,
      source TEXT NOT NULL DEFAULT 'deterministic' CHECK (source IN ('llm', 'deterministic')),
      analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by BIGINT REFERENCES users(id)
    )`),
    tx.query(`CREATE TABLE IF NOT EXISTS applicant_requests (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'deterministic' CHECK (source IN ('llm', 'deterministic')),
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`),
    tx.query("CREATE INDEX IF NOT EXISTS evidence_items_application_id_idx ON evidence_items(application_id)"),
    tx.query("CREATE INDEX IF NOT EXISTS analyses_application_time_idx ON analyses(application_id, analyzed_at DESC)"),
    tx.query("CREATE INDEX IF NOT EXISTS applicant_requests_application_time_idx ON applicant_requests(application_id, created_at DESC)"),
    tx.query("CREATE INDEX IF NOT EXISTS applications_owner_id_idx ON applications(owner_id)"),
  ]);

  await seed(db);
}

async function seed(db: Db): Promise<void> {
  const results = await db.transaction((tx) => [
    tx.query(
      `INSERT INTO users (email, password_hash, role, display_name)
       VALUES ($1, $2, 'reviewer', $3)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      ["reviewer@demo.local", hashPasswordSync("Reviewer123!"), "Demo Reviewer"],
    ),
    tx.query(
      `INSERT INTO users (email, password_hash, role, display_name)
       VALUES ($1, $2, 'applicant', $3)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      ["applicant@demo.local", hashPasswordSync("Applicant123!"), "Demo Applicant"],
    ),
  ]);
  const applicantId = (results[1][0] as { id: string }).id;

  for (const app of SEED_APPLICATIONS) {
    await db.query(
      `INSERT INTO applications
        (id, applicant_name, programme, submitted_at, contact, summary, owner_id, theme, country, purpose, target_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        app.id, app.applicantName, app.programme, app.submittedAt, app.contact,
        app.summary, app.id === "APP-3" ? null : applicantId, app.theme ?? "",
        app.country ?? "", app.purpose ?? "", app.targetGroup ?? "",
      ],
    );
    await db.transaction((tx) =>
      app.evidence.map((e) =>
        tx.query(
          `INSERT INTO evidence_items
            (application_id, kind, label, status, document_id, file_name, submitted_at, organisation_name, signatory, content)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (application_id, kind) DO NOTHING`,
          [
            app.id, e.kind, e.label, e.status, e.documentId ?? null,
            e.fileName ?? null, e.submittedAt ?? null, e.organisationName ?? null,
            e.signatory ?? null, e.content ?? "",
          ],
        ),
      ),
    );
  }
}
