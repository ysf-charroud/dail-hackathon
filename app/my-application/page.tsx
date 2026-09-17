"use client";

import { Suspense, use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to view your application." };

  const { data: apps } = await supabase
    .from("applications")
    .select("id, applicant_name, programme, evidence_items(*)")
    .eq("owner_id", user.id)
    .limit(1);
  const row = apps?.[0];
  if (!row) return { error: "No application is linked to this account yet." };

  const { data: analyses } = await supabase
    .from("analyses")
    .select("status, summary")
    .eq("application_id", row.id)
    .order("analyzed_at", { ascending: false })
    .limit(1);
  const { data: requests } = await supabase
    .from("applicant_requests")
    .select("message")
    .eq("application_id", row.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const evidence: EvidenceItem[] = (row.evidence_items ?? []).map(
    (e: {
      kind: EvidenceItem["kind"];
      label: string;
      status: "provided" | "missing";
      document_id: string | null;
      file_name: string | null;
      submitted_at: string | null;
      organisation_name: string | null;
      signatory: string | null;
      content: string;
    }) => ({
      kind: e.kind,
      label: e.label,
      status: e.status,
      documentId: e.document_id ?? undefined,
      fileName: e.file_name ?? undefined,
      submittedAt: e.submitted_at ?? undefined,
      organisationName: e.organisation_name ?? undefined,
      signatory: e.signatory ?? undefined,
      content: e.content,
    }),
  );
  const analysis = analyses?.[0];
  return {
    app: {
      id: row.id,
      applicantName: row.applicant_name,
      programme: row.programme,
      evidence,
      status: (analysis?.status ?? "analysis_required") as ReviewStatus,
      latestSummary: analysis?.summary ?? null,
      latestRequest: requests?.[0]?.message ?? null,
    },
  };
}

function ApplicantView({ onSaved }: { onSaved: () => void }) {
  const configured = supabaseConfigured();
  const result = use(
    useMemo(() => (configured ? loadData() : Promise.resolve(null)), [
      configured,
    ]),
  );

  const saveEvidence = async (app: OwnApp, next: EvidenceItem[]) => {
    const supabase = createClient();
    for (const e of next) {
      await supabase.from("evidence_items").upsert(
        {
          application_id: app.id,
          kind: e.kind,
          label: e.label,
          status: e.status,
          document_id: e.documentId ?? null,
          file_name: e.fileName ?? null,
          submitted_at: e.submittedAt ?? null,
          organisation_name: e.organisationName ?? null,
          signatory: e.signatory ?? null,
          content: e.content ?? "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "application_id,kind" },
      );
    }
    await supabase.from("analyses").delete().eq("application_id", app.id);
    onSaved();
  };

  if (!configured) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <Alert variant="destructive">
          <AlertTitle>Sign-in unavailable</AlertTitle>
          <AlertDescription>
            Supabase is not configured in this environment.
          </AlertDescription>
        </Alert>
        <Link href="/login">
          <Button variant="outline" size="sm">
            <ArrowLeft data-icon="inline-start" aria-hidden /> Sign in
          </Button>
        </Link>
      </div>
    );
  }

  if (!result || !("app" in result)) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <Alert variant="destructive">
          <AlertTitle>Nothing to show</AlertTitle>
          <AlertDescription>
            {result && "error" in result ? result.error : "Unknown error."}
          </AlertDescription>
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

export default function MyApplicationPage() {
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
