"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Mail,
  RotateCcw,
  ScrollText,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  completionPercent,
  STATUS_LABELS,
  type EvidenceItem,
  type StoredAnalysis,
} from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { EvidenceChecklist } from "@/components/evidence-checklist";
import { AnalysisPanel } from "@/components/analysis-panel";
import { RequestPanel } from "@/components/request-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { get, updateEvidence, setAnalysis, reset } = useStore();
  const app = get(params.id);

  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSource, setRequestSource] = useState<
    "llm" | "deterministic" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  if (!app) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft data-icon="inline-start" aria-hidden /> Back to
          applications
        </Button>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">
              Application “{params.id}” was not found. It may have been removed
              from the synthetic dataset.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pct = completionPercent(app);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const { id, applicantName, programme, submittedAt, contact, summary, evidence } =
        app;
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application: {
            id,
            applicantName,
            programme,
            submittedAt,
            contact,
            summary,
            evidence,
          },
        }),
      });
      if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
      const data = (await res.json()) as StoredAnalysis;
      setAnalysis(app.id, {
        status: data.status,
        summary: data.summary,
        issues: data.issues,
        source: data.source,
        analyzedAt: data.analyzedAt,
      });
      // Stale request draft no longer matches fresh analysis.
      setRequestMessage("");
      setRequestSource(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateRequest = async () => {
    if (!app.lastAnalysis) return;
    setGenerating(true);
    setError(null);
    try {
      const { id, applicantName, programme, submittedAt, contact, summary, evidence } =
        app;
      const res = await fetch("/api/draft-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application: {
            id,
            applicantName,
            programme,
            submittedAt,
            contact,
            summary,
            evidence,
          },
          analysis: {
            status: app.lastAnalysis.status,
            summary: app.lastAnalysis.summary,
            issues: app.lastAnalysis.issues,
          },
        }),
      });
      if (!res.ok) throw new Error(`Request generation failed (${res.status})`);
      const data = (await res.json()) as {
        message: string;
        source: "llm" | "deterministic";
      };
      setRequestMessage(data.message);
      setRequestSource(data.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleEvidenceChange = (next: EvidenceItem[]) => {
    updateEvidence(app.id, next);
    setRequestMessage("");
    setRequestSource(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft data-icon="inline-start" aria-hidden /> Applications
          </Button>
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          {app.id}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => {
            reset(app.id);
            setRequestMessage("");
            setRequestSource(null);
          }}
        >
          <RotateCcw data-icon="inline-start" aria-hidden /> Reset demo state
        </Button>
      </div>

      <div
        className={`rounded-xl border p-5 ${
          app.status === "review_ready"
            ? "border-emerald-600/20 bg-emerald-500/10"
            : app.status === "missing_evidence"
              ? "border-destructive/20 bg-destructive/5"
              : app.status === "needs_clarification"
                ? "border-amber-600/20 bg-amber-500/10"
                : "border bg-card"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {app.status === "review_ready" ? (
            <CheckCircle2 className="size-8 text-emerald-600" aria-hidden />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {app.applicantName}
              </h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {app.status === "review_ready"
                ? "All required evidence is present with no unresolved mismatch. Ready for human review. The funding decision itself remains human."
                : app.status === "missing_evidence"
                  ? "A required evidence item is missing. The application is not yet ready for human review."
                  : app.status === "needs_clarification"
                    ? "Evidence is present but inconsistent. Human clarification is required before review can proceed."
                    : app.lastAnalysis
                      ? "Evidence changed since the last analysis. Re-run AI analysis to refresh the status."
                      : "This application has not been analyzed yet. Run AI analysis to check readiness."}
            </p>
          </div>
          <div className="w-44 shrink-0">
            <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
              <span>Evidence</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {STATUS_LABELS[app.status]}, {pct}% complete
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Applicant details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 text-sm">
              <p className="flex items-center gap-2">
                <Building2
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                <span className="font-semibold">{app.applicantName}</span>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <ScrollText className="size-4" aria-hidden />
                {app.programme}, {app.id}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden />
                Submitted {app.submittedAt}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" aria-hidden />
                {app.contact}
              </p>
              <Separator />
              <p className="rounded-lg bg-muted p-3 text-muted-foreground">
                {app.summary}
              </p>
              <p>
                <Badge variant="outline">Synthetic record</Badge>
              </p>
            </CardContent>
          </Card>

          <EvidenceChecklist
            applicantName={app.applicantName}
            evidence={app.evidence}
            onChange={handleEvidenceChange}
          />
        </div>

        <div className="flex flex-col gap-5">
          <AnalysisPanel
            status={app.status}
            analysis={app.lastAnalysis}
            analyzing={analyzing}
            onAnalyze={runAnalysis}
          />
          <RequestPanel
            hasAnalysis={app.lastAnalysis !== null && !app.dirty}
            generating={generating}
            source={requestSource}
            message={requestMessage}
            onGenerate={generateRequest}
          />
          <Card className="border-dashed">
            <CardContent className="pt-5 text-xs leading-relaxed text-muted-foreground">
              Human oversight: AI analysis highlights gaps and inconsistencies
              only. “{STATUS_LABELS.review_ready}” means evidence is complete
              and consistent. It is not an approval. A human reviewer makes
              every programme decision.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
