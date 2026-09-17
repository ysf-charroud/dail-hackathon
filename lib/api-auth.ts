import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type Session } from "./session";

export async function currentSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function dbUnavailable() {
  return Response.json({ error: "Database unavailable" }, { status: 503 });
}
