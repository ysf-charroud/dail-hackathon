import {
  CheckCircle2,
  FilePlus2,
  Inbox,
  MailPlus,
  RefreshCw,
  ScanSearch,
} from "lucide-react";
import type { TrailEvent } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function iconFor(label: string) {
  if (label.includes("ready")) return CheckCircle2;
  if (label.includes("request")) return MailPlus;
  if (label.includes("updated")) return RefreshCw;
  if (label.includes("review run")) return ScanSearch;
  if (label.includes("received")) return Inbox;
  return FilePlus2;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Meaningful review events: received → reviewed → requested → updated → ready. */
export function ReviewTrail({ events }: { events: TrailEvent[] }) {
  if (events.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-0">
          {events.map((e, i) => {
            const Icon = iconFor(e.label);
            const last = i === events.length - 1;
            return (
              <li key={`${e.at}-${i}`} className="flex gap-3">
                <span className="flex flex-col items-center">
                  <span className="flex size-7 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  {!last ? (
                    <span className="w-px flex-1 bg-border" aria-hidden />
                  ) : null}
                </span>
                <span className={!last ? "pb-4" : ""}>
                  <span className="block text-sm font-medium">{e.label}</span>
                  {e.detail ? (
                    <span className="block text-xs text-muted-foreground">
                      {e.detail}
                    </span>
                  ) : null}
                  <time className="block text-[11px] text-muted-foreground">
                    {formatTime(e.at)}
                  </time>
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
