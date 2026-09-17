/**
 * Edge-safe signed sessions (HMAC-SHA256, WebCrypto only — no Node APIs,
 * so middleware can verify roles without touching the database).
 */

export interface Session {
  userId: number;
  role: "reviewer" | "applicant";
  exp: number;
}

export const SESSION_COOKIE = "c07-session";
const WEEK = 7 * 24 * 3600;

function secret(): string {
  return (
    process.env.SESSION_SECRET?.trim() ||
    "dev-only-secret-change-me-in-production"
  );
}

function b64url(data: Uint8Array | string): string {
  const bin =
    typeof data === "string"
      ? data
      : String.fromCharCode(...data);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string): string {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return b64url(new Uint8Array(sig));
}

export async function signSession(
  userId: number,
  role: Session["role"],
): Promise<string> {
  const payload = b64url(
    JSON.stringify({
      userId,
      role,
      exp: Math.floor(Date.now() / 1000) + WEEK,
    }),
  );
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = await hmac(payload);
    if (sig.length !== expected.length) return null;
    const a = new TextEncoder().encode(sig);
    const b = new TextEncoder().encode(expected);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    if (diff !== 0) return null;
    const data = JSON.parse(unb64url(payload)) as Session;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    if (data.role !== "reviewer" && data.role !== "applicant") return null;
    return data;
  } catch {
    return null;
  }
}
