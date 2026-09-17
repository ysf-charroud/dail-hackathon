import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Badge } from "./ui/badge";

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm leading-tight font-semibold">
              Evidence Review
            </span>
            <span className="block text-xs text-muted-foreground">
              Application readiness, C07 prototype
            </span>
          </span>
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Badge variant="outline">Synthetic Data</Badge>
          <Badge variant="secondary">AI assists, humans decide</Badge>
        </div>
      </div>
    </header>
  );
}
