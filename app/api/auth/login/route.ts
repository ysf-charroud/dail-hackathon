import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { dbUnavailable } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function setSessionCookie(res: Response, token: string) {
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
  );
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return Response.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }
  let db;
  try {
    db = await getDb();
  } catch (error) {
    console.error("Database initialization failed", error);
    return dbUnavailable();
  }
  const [row] = (await db.query(
    "SELECT id::int, password_hash, role FROM users WHERE email = $1",
    [email],
  )) as { id: number; password_hash: string; role: "reviewer" | "applicant" }[];
  if (!row || !verifyPassword(password, row.password_hash)) {
    return Response.json({ error: "Invalid login credentials" }, { status: 401 });
  }
  const res = Response.json({ role: row.role });
  setSessionCookie(res, await signSession(row.id, row.role));
  return res;
}
