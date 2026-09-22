"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";

interface Me {
  email: string;
  role: "reviewer" | "applicant";
  display_name: string;
}

export function AuthButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          if (!cancelled) setMe(null);
          return;
        }
        const { user } = (await res.json()) as { user: Me };
        if (!cancelled) setMe(user);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/login");
    router.refresh();
  };

  if (me === undefined) return null;

  if (!me) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
      >
        <LogIn aria-hidden /> Sign in
      </Link>
    );
  }

  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card py-1 pr-1 pl-3 text-sm">
      <span className="hidden max-w-36 truncate font-medium sm:block">
        {me.display_name || me.email}
      </span>
      <span className="hidden text-xs text-muted-foreground md:inline">
        {me.role === "reviewer" ? "Reviewer" : "Applicant"}
      </span>
      <button
        onClick={() => void signOut()}
        aria-label="Sign out"
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <LogOut aria-hidden />
      </button>
    </span>
  );
}
