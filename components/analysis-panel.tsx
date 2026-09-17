"use client";

import {
  AlertTriangle,
  FileWarning,
  ArrowLeftRight,
  Bot,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { StoredAnalysis } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Spinner } from "./ui/spinner";

export function AnalysisPanel({
  status,
  analysis,
  analyzing,
  onAnalyze,
}: {
  status: string;
  analysis: StoredAnalysis | null;
  analyzing: boolean;
  onAnalyze: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Bot aria-hidden /> Evidence review
          </CardTitle>
          {analysis ? (
            <Badge variant="outline">
              {analysis.source === "llm" ? "AI-assisted review" : "Fallback review mode"}
            </Badge>
          ) : null}
          <Button
            size="sm"
            onClick={onAnalyze}
            disabled={analyzing}
            className="ml-auto"
          >
            {analyzing ? (
              <>
                <Spinner data-icon="inline-start" /> Analyzing
              </>
            ) : (
              <>
                <Sparkles data-icon="inline-start" aria-hidden />
                {analysis ? "Re-analyze" : "Run evidence review"}
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          AI identifies missing evidence and inconsistencies. It never approves
          or rejects. The final programme decision belongs to a human
          caseworker — not yet made until they assess the ready file.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {analyzing && !analysis ? (
          <div className="flex flex-col gap-2" aria-label="Analyzing">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : null}
        {!analysis && !analyzing && status === "analysis_required" ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            No analysis yet. Run evidence review to check the 3 required evidence
            items and compare names across documents.
          </p>
        ) : null}
        {analysis ? (
          <>
            <Alert
              className={
                analysis.status === "review_ready"
                  ? "border-emerald-600/20 bg-emerald-500/10"
                  : analysis.status === "missing_evidence"
                    ? "border-destructive/20 bg-destructive/5"
                    : "border-amber-600/20 bg-amber-500/10"
              }
            >
              {analysis.status === "review_ready" ? (
                <CheckCircle2 aria-hidden />
              ) : analysis.status === "missing_evidence" ? (
                <FileWarning aria-hidden />
              ) : (
                <AlertTriangle aria-hidden />
              )}
              <AlertTitle>
                {analysis.status === "review_ready"
                  ? "Ready for programme review"
                  : analysis.status === "missing_evidence"
                    ? "Missing evidence"
                    : "Needs clarification"}
              </AlertTitle>
              <AlertDescription>{analysis.summary}</AlertDescription>
            </Alert>
            {analysis.status === "review_ready" ? (
              <p className="rounded-lg border border-dashed p-3 text-xs leading-relaxed text-muted-foreground">
                Evidence review complete. Human programme decision: not yet
                made. A caseworker now continues the human assessment — this
                state is not funding approval.
              </p>
            ) : null}
            {analysis.issues.length === 0 ? (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden /> No issues found.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {analysis.issues.map((issue, i) => (
                  <li
                    key={`${issue.field}-${i}`}
                    className="rounded-lg border p-3.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {issue.type === "missing_evidence" ? (
                        <FileWarning
                          className="size-4 text-destructive"
                          aria-hidden
                        />
                      ) : (
                        <ArrowLeftRight
                          className="size-4 text-amber-700"
                          aria-hidden
                        />
                      )}
                      <span className="text-sm font-semibold">
                        {issue.type === "missing_evidence"
                          ? "Missing evidence"
                          : "Information mismatch"}
                      </span>
                      <Badge
                        variant={
                          issue.severity === "blocking"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {issue.severity === "blocking"
                          ? "Blocking"
                          : "Uncertain — needs clarification"}
                      </Badge>
                      {issue.sourceDocumentId ? (
                        <Badge variant="secondary">
                          Source: {issue.sourceDocumentId}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No source yet</Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {issue.message}
                    </p>
                    {issue.type === "mismatch" ? (
                      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md bg-muted p-2.5 text-xs">
                          <span className="block font-semibold text-muted-foreground">
                            Applicant name
                          </span>
                          <span className="font-medium">
                            {issue.applicationValue}
                          </span>
                        </div>
                        <div className="rounded-md bg-amber-500/10 p-2.5 text-xs">
                          <span className="block font-semibold text-amber-800">
                            Registration record
                          </span>
                          <span className="font-medium text-amber-900">
                            {issue.evidenceValue}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {issue.requiresHumanClarification ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-800">
                        <AlertTriangle className="size-3.5" aria-hidden />
                        Uncertain — human clarification is required. Never
                        auto-rejected (RULE-2).
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Rules applied: RULE-1 (registration, activity plan, named signoff),
          RULE-2 (mismatch → clarification, never rejection), RULE-3 (a human
          reviewer alone decides). No other rules are used.
        </p>
      </CardContent>
    </Card>
  );
}
