import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { SEED_APPLICATIONS } from "./data";
import { hashPasswordSync } from "./password";

let db: Database.Database | null = null;

function openDb(): Database.Database {
  // Static path keeps Turbopack tracing happy; SQLITE_FILE overrides it.
  if (process.env.SQLITE_FILE) return new Database(process.env.SQLITE_FILE);
  const file = join(process.cwd(), "data", "c07.db");
  try {
    return new Database(file);
  } catch {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    return new Database(file);
  }
}

export function getDb(): Database.Database {
  if (db) return db;
  db = openDb();
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('reviewer','applicant')),
      display_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicant_name TEXT NOT NULL,
      programme TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      owner_id INTEGER REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS evidence_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'missing',
      document_id TEXT,
      file_name TEXT,
      submitted_at TEXT,
      organisation_name TEXT,
      signatory TEXT,
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (application_id, kind)
    );
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      issues TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'deterministic',
      analyzed_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by INTEGER REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS applicant_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'deterministic',
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  if (
    (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n ===
    0
  ) {
    seed(db);
  }
  return db;
}

function seed(db: Database.Database) {
  const insertUser = db.prepare(
    "INSERT INTO users (email, password_hash, role, display_name) VALUES (?, ?, ?, ?)",
  );
  const reviewer = insertUser.run(
    "reviewer@demo.local",
    hashPasswordSync("Reviewer123!"),
    "reviewer",
    "Demo Reviewer",
  ).lastInsertRowid as number;
  const applicant = insertUser.run(
    "applicant@demo.local",
    hashPasswordSync("Applicant123!"),
    "applicant",
    "Demo Applicant",
  ).lastInsertRowid as number;

  const owners: Record<string, number | null> = {
    "APP-1": applicant,
    "APP-2": applicant,
    "APP-3": null,
  };
  const insertApp = db.prepare(
    "INSERT INTO applications (id, applicant_name, programme, submitted_at, contact, summary, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const insertEv = db.prepare(
    "INSERT INTO evidence_items (application_id, kind, label, status, document_id, file_name, submitted_at, organisation_name, signatory, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const app of SEED_APPLICATIONS) {
    insertApp.run(
      app.id,
      app.applicantName,
      app.programme,
      app.submittedAt,
      app.contact,
      app.summary,
      owners[app.id] ?? null,
    );
    for (const e of app.evidence) {
      insertEv.run(
        app.id,
        e.kind,
        e.label,
        e.status,
        e.documentId ?? null,
        e.fileName ?? null,
        e.submittedAt ?? null,
        e.organisationName ?? null,
        e.signatory ?? null,
        e.content ?? "",
      );
    }
  }
  void reviewer;
}
