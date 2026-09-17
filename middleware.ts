import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const REVIEWER_PATHS = ["/applications"];
const APPLICANT_PATHS = ["/my-application"];

function isPath(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // No auth backend configured: leave the local demo open.
  if (!url || !key) return NextResponse.next();

  const response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await supabase.auth.getUser();

  const needsReviewer = isPath(pathname, REVIEWER_PATHS);
  const needsApplicant = isPath(pathname, APPLICANT_PATHS);
  if (!needsReviewer && !needsApplicant) return response;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role;

  if (needsReviewer && role !== "reviewer") {
    const home = request.nextUrl.clone();
    home.pathname = role === "applicant" ? "/my-application" : "/login";
    return NextResponse.redirect(home);
  }
  if (needsApplicant && role !== "applicant") {
    const home = request.nextUrl.clone();
    home.pathname = role === "reviewer" ? "/applications" : "/login";
    return NextResponse.redirect(home);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
