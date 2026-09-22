import { getDb } from "@/lib/db";
import { hashPasswordSync } from "@/lib/password";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email || password.length < 6) {
    return Response.json(
      { error: "Email and a password of 6+ characters are required" },
      { status: 400 },
    );
  }
  let db;
  try {
    db = await getDb();
  } catch {
    return dbUnavailable();
  }
  const [existing] = await db.query(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );
  if (existing) {
    return Response.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }
  const [created] = (await db.query(
    "INSERT INTO users (email, password_hash, role, display_name) VALUES ($1, $2, 'applicant', $3) RETURNING id::int",
    [email, hashPasswordSync(password), email.split("@")[0]],
  )) as { id: number }[];
  const res = Response.json({ role: "applicant" as const });
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${await signSession(created.id, "applicant")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
  );
  return res;
}
