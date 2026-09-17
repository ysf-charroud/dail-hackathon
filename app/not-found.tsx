import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you requested does not exist.
      </p>
      <Link href="/applications">
        <Button variant="outline" size="sm">
          Back to applications
        </Button>
      </Link>
    </div>
  );
}
