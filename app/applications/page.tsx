"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Inbox } from "lucide-react";
import { useStore, issueCount } from "@/lib/store";
import { completionPercent, type ReviewStatus } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ApplicationsPage() {
  const { apps } = useStore();

  const counts: Record<ReviewStatus, number> = {
    analysis_required: 0,
    missing_evidence: 0,
    needs_clarification: 0,
    review_ready: 0,
  };
  for (const app of apps) counts[app.status] += 1;
  const flagged = counts.missing_evidence + counts.needs_clarification;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-5 border-b pb-7 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Synthetic data</Badge>
            <span>Programme casework</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Application review queue</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Check evidence, resolve questions, and prepare complete files for human review.
            AI supports the evidence check. It does not make funding decisions.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-6 lg:ml-auto">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Inbox aria-hidden /> Total</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{apps.length}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><CircleAlert aria-hidden /> Flagged</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{flagged}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 aria-hidden /> Ready</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{counts.review_ready}</dd>
          </div>
        </dl>
      </div>

      <section aria-labelledby="queue-title" className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-end gap-3 border-b px-5 py-4">
          <div>
            <h2 id="queue-title" className="font-semibold">Active files</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Open a file to run its evidence review.</p>
          </div>
          <p className="ml-auto text-xs text-muted-foreground">Sorted by submission date</p>
        </div>

        <div className="hidden grid-cols-[80px_minmax(220px,1fr)_180px_170px_170px_32px] gap-4 border-b bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid">
          <span>Reference</span>
          <span>Applicant</span>
          <span>Programme</span>
          <span>Evidence</span>
          <span>Review state</span>
          <span className="sr-only">Open</span>
        </div>

        <div className="divide-y">
          {apps.map((app) => {
            const pct = completionPercent(app);
            const issues = app.dirty ? null : issueCount(app);
            return (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="group grid gap-4 px-5 py-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 md:grid-cols-[80px_minmax(220px,1fr)_180px_170px_170px_32px] md:items-center"
              >
                <span className="font-mono text-xs font-semibold text-muted-foreground">{app.id}</span>
                <span>
                  <span className="block text-sm font-semibold">{app.applicantName}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Submitted {app.submittedAt}</span>
                </span>
                <span className="text-sm text-muted-foreground">{app.programme}</span>
                <span className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                  <Progress value={pct} />
                  <span className="text-xs font-medium tabular-nums">{pct}%</span>
                  <span className="col-span-2 text-xs text-muted-foreground">{pct === 100 ? "3 of 3 provided" : `${Math.round(pct / 33.4)} of 3 provided`}</span>
                </span>
                <span className="flex flex-col items-start gap-1.5">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-muted-foreground">
                    {issues === null ? "Awaiting analysis" : issues === 0 ? "No issues found" : `${issues} issue${issues === 1 ? "" : "s"}`}
                  </span>
                </span>
                <ArrowRight className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Demo path:</span>
        <span>open a file</span><span aria-hidden>›</span><span>run review</span><span aria-hidden>›</span>
        <span>request evidence</span><span aria-hidden>›</span><span>simulate fix</span><span aria-hidden>›</span><span>review ready</span>
      </div>
    </div>
  );
}
