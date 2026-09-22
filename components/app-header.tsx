"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "./auth-button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Applications", href: "/applications" },
  { label: "MCP setup", href: "/mcp" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center px-5 py-1.5 text-xs lg:px-8">
          <span>Programme evidence review</span>
          <span className="ml-auto hidden opacity-85 sm:inline">Synthetic data · Exercise prototype</span>
        </div>
      </div>
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-7 border-b px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Schmitz-Stiftungen evidence review home">
          <Image
            src="/images/schmitz-stiftungen-logo.png"
            alt="Schmitz-Stiftungen"
            width={184}
            height={60}
            className="h-auto w-36 sm:w-44"
            priority
          />
          <span className="hidden border-l pl-3 text-xs leading-5 text-muted-foreground lg:block">
            Evidence<br />review
          </span>
        </Link>

        <nav aria-label="Primary" className="flex min-w-0 items-stretch self-stretch">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
