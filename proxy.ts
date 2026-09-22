import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const REVIEWER_PATHS = ["/applications"];
const APPLICANT_PATHS = ["/my-application"];

function isPath(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsReviewer = isPath(pathname, REVIEWER_PATHS);
  const needsApplicant = isPath(pathname, APPLICANT_PATHS);
  if (!needsReviewer && !needsApplicant) return NextResponse.next();

  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value ?? "",
  );
  if (!session) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (needsReviewer && session.role !== "reviewer") {
    const home = request.nextUrl.clone();
    home.pathname =
      session.role === "applicant" ? "/my-application" : "/login";
    return NextResponse.redirect(home);
  }
  if (needsApplicant && session.role !== "applicant") {
    const home = request.nextUrl.clone();
    home.pathname = session.role === "reviewer" ? "/applications" : "/login";
    return NextResponse.redirect(home);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
