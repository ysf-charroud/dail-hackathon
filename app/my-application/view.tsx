"use client";

import { Suspense, use, useMemo, useState } from "react";import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { EvidenceItem } from "@/lib/types";
import { EvidenceChecklist } from "@/components/evidence-checklist";
import { StatusBadge } from "@/components/status-badge";
import { completionPercent, type ReviewStatus } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OwnApp {
  id: string;
  applicantName: string;
  programme: string;
  evidence: EvidenceItem[];
  status: ReviewStatus;
  latestSummary: string | null;
  latestRequest: string | null;
}

type LoadResult = { app: OwnApp } | { error: string };

async function loadData(): Promise<LoadResult> {
  const res = await fetch("/api/apps");
  if (res.status === 401) {
    return { error: "Please sign in to view your application." };
  }
  if (!res.ok) {
    return { error: "Could not load your application. Try again." };
  }
  const { applications } = (await res.json()) as {
    applications: {
      id: string;
      applicant_name: string;
      programme: string;
      evidence: {
        kind: EvidenceItem["kind"];
        label: string;
        status: "provided" | "missing";
        document_id: string | null;
        file_name: string | null;
        submitted_at: string | null;
        organisation_name: string | null;
        signatory: string | null;
        content: string;
      }[];
      latestAnalysis: { status: string; summary: string } | null;
    }[];
  };
  const row = applications[0];
  if (!row) return { error: "No application is linked to this account yet." };

  let latestRequest: string | null = null;
  const detail = await fetch(`/api/apps/${row.id}`);
  if (detail.ok) {
    const { application } = (await detail.json()) as {
      application: { latestRequest: string | null };
    };
    latestRequest = application.latestRequest;
  }
  const analysis = row.latestAnalysis;
  return {
    app: {
      id: row.id,
      applicantName: row.applicant_name,
      programme: row.programme,
      evidence: row.evidence.map((e) => ({
        kind: e.kind,
        label: e.label,
        status: e.status,
        documentId: e.document_id ?? undefined,
        fileName: e.file_name ?? undefined,
        submittedAt: e.submitted_at ?? undefined,
        organisationName: e.organisation_name ?? undefined,
        signatory: e.signatory ?? undefined,
        content: e.content,
      })),
      status: (analysis?.status ?? "analysis_required") as ReviewStatus,
      latestSummary: analysis?.summary ?? null,
      latestRequest,
    },
  };
}

function ApplicantView({ onSaved }: { onSaved: () => void }) {
  const result = use(useMemo(() => loadData(), []));

  const saveEvidence = async (app: OwnApp, next: EvidenceItem[]) => {
    await fetch(`/api/apps/${app.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evidence: next.map((e) => ({
          kind: e.kind,
          label: e.label,
          status: e.status,
          document_id: e.documentId ?? null,
          file_name: e.fileName ?? null,
          submitted_at: e.submittedAt ?? null,
          organisation_name: e.organisationName ?? null,
          signatory: e.signatory ?? null,
          content: e.content ?? "",
        })),
      }),
    });
    onSaved();
  };

  if (!("app" in result)) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <Alert variant="destructive">
          <AlertTitle>Nothing to show</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
        <Link href="/login">
          <Button variant="outline" size="sm">
            <ArrowLeft data-icon="inline-start" aria-hidden /> Sign in
          </Button>
        </Link>
      </div>
    );
  }

  const { app } = result;
  const pct = completionPercent({
    ...app,
    submittedAt: "",
    contact: "",
    summary: "",
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight">
          {app.applicantName}
        </h1>
        <StatusBadge status={app.status} />
        <span className="ml-auto text-sm text-muted-foreground">
          {app.programme}, {pct}% evidence
        </span>
      </div>

      {app.latestRequest ? (
        <Card>
          <CardHeader>
            <CardTitle>Latest message from your reviewer</CardTitle>
            <CardDescription>
              A human reviewer wrote this — respond by updating your evidence
              below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
              {app.latestRequest}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {app.latestSummary ? (
        <p>
          <Badge variant="outline">Reviewer note: {app.latestSummary}</Badge>
        </p>
      ) : null}

      <EvidenceChecklist
        applicantName={app.applicantName}
        evidence={app.evidence}
        onChange={(next) => void saveEvidence(app, next)}
      />
    </div>
  );
}

export default function MyApplicationView() {
  const [refresh, setRefresh] = useState(0);
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <ApplicantView
        key={refresh}
        onSaved={() => setRefresh((r) => r + 1)}
      />
    </Suspense>
  );
}
