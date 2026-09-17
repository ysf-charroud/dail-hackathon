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
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium shadow-lg shadow-blue-900/10"
      >
        <LogIn className="size-4" aria-hidden /> Sign in
      </Link>
    );
  }

  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card py-1 pr-1 pl-4 text-sm shadow-lg shadow-blue-900/10">
      <span className="max-w-40 truncate font-medium">
        {me.display_name || me.email}
      </span>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
        {me.role === "reviewer" ? "Reviewer" : "Applicant"}
      </span>
      <button
        onClick={() => void signOut()}
        aria-label="Sign out"
        className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    </span>
  );
}
