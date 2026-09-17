"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  ClipboardCheck,
  Inbox,
  ListChecks,
} from "lucide-react";
import { useStore, issueCount } from "@/lib/store";
import { completionPercent, type ReviewStatus } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const DEMO_STEPS = [
  "Open a flagged application",
  "Inspect the evidence checklist",
  "Run AI analysis",
  "Generate the applicant request",
  "Simulate the fix, then re-analyze to Review Ready",
];

export default function ApplicationsPage() {
  const { apps } = useStore();

  const counts: Record<ReviewStatus, number> = {
    analysis_required: 0,
    missing_evidence: 0,
    needs_clarification: 0,
    review_ready: 0,
  };
  for (const a of apps) counts[a.status] += 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review which applications are ready for human review, what evidence
            is missing, and what needs clarification. Final decisions always
            belong to a human reviewer.
          </p>
        </div>
        <div className="ml-auto flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Inbox className="size-4" aria-hidden />
            {apps.length} total
          </span>
          <span className="flex items-center gap-1.5">
            <CircleAlert className="size-4" aria-hidden />
            {counts.missing_evidence + counts.needs_clarification} flagged
          </span>
          <span className="flex items-center gap-1.5">
            <ClipboardCheck className="size-4" aria-hidden />
            {counts.review_ready} ready
          </span>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-2.5 pt-5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4" aria-hidden /> Review workflow
          </p>
          <ol className="flex flex-wrap gap-2">
            {DEMO_STEPS.map((s, i) => (
              <li key={s}>
                <Badge variant="secondary">
                  {i + 1}. {s}
                </Badge>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application list</CardTitle>
          <CardDescription>
            Three applications covering each review outcome.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="hidden grid-cols-[90px_1fr_170px_170px_150px_90px] gap-3 px-4 text-xs font-medium text-muted-foreground md:grid">
            <span>ID</span>
            <span>Applicant</span>
            <span>Type</span>
            <span>Completion</span>
            <span>Status</span>
            <span className="text-right">Issues</span>
          </div>
          {apps.map((app) => {
            const pct = completionPercent(app);
            const issues = app.dirty ? null : issueCount(app);
            return (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="grid gap-3 rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-muted/50 md:grid-cols-[90px_1fr_170px_170px_150px_90px] md:items-center"
              >
                <span className="font-mono text-xs font-semibold">
                  {app.id}
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {app.applicantName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Submitted {app.submittedAt}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {app.programme}
                </span>
                <span>
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">
                    {pct}%
                  </span>
                  <Progress value={pct} />
                </span>
                <span>
                  <StatusBadge status={app.status} />
                </span>
                <span className="md:text-right">
                  {issues === null ? (
                    <Badge variant="outline">Not analyzed</Badge>
                  ) : issues === 0 ? (
                    <Badge variant="default">0 issues</Badge>
                  ) : (
                    <Badge variant="destructive">
                      {issues} issue{issues === 1 ? "" : "s"}
                    </Badge>
                  )}
                </span>
                <span className="md:hidden">
                  <Button variant="outline" size="sm">
                    Open <ArrowRight data-icon="inline-end" aria-hidden />
                  </Button>
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
