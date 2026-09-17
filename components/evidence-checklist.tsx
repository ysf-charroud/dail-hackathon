"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  Upload,
  UploadCloud,
  XCircle,
} from "lucide-react";
import type { EvidenceItem } from "@/lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";

function mockSignoffUpload(applicantName: string): EvidenceItem {
  const today = new Date().toISOString().slice(0, 10);
  return {
    kind: "responsible_person_signoff",
    label: "Responsible-person signoff",
    status: "provided",
    fileName: `signoff_${applicantName.replace(/\W+/g, "_")}.pdf`,
    submittedAt: today,
    organisationName: applicantName,
    signatory: "A. Malik, Responsible Person",
    content:
      `RESPONSIBLE-PERSON SIGNOFF — ${applicantName}\n` +
      `I confirm the activity plan is accurate and delivery capacity is in place.\n` +
      `Signed: A. Malik, Responsible Person, ${today}.`,
  };
}

const MAX_FILE_BYTES = 500_000;
const MAX_CONTENT_CHARS = 8000;
const TEXT_EXTENSIONS = ["txt", "md", "markdown", "csv", "json", "log", "text"];

export function EvidenceChecklist({
  applicantName,
  evidence,
  onChange,
}: {
  applicantName: string;
  evidence: EvidenceItem[];
  onChange: (next: EvidenceItem[]) => void;
}) {
  const [viewing, setViewing] = useState<EvidenceItem | null>(null);
  const [fixingMismatch, setFixingMismatch] = useState(false);
  const [fixedName, setFixedName] = useState("");
  const [pendingKind, setPendingKind] =
    useState<EvidenceItem["kind"] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const startUpload = (kind: EvidenceItem["kind"]) => {
    setUploadError(null);
    setPendingKind(kind);
    fileInput.current?.click();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !pendingKind) return;
    const kind = pendingKind;
    setPendingKind(null);
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(
        `“${file.name}” is too large (limit 500 KB). Try a smaller file or run Simulated upload.`,
      );
      return;
    }
    setReadingFile(true);
    setUploadError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const readable =
        file.type.startsWith("text/") ||
        TEXT_EXTENSIONS.includes(ext) ||
        file.type === "application/json";
      const today = new Date().toISOString().slice(0, 10);
      const label =
        evidence.find((e) => e.kind === kind)?.label ?? "Evidence";
      let content: string;
      if (readable) {
        const text = (await file.text()).slice(0, MAX_CONTENT_CHARS);
        content =
          `${label} — uploaded file "${file.name}"\n` +
          `Submitted during review on ${today}.\n\n${text}`;
      } else {
        content =
          `${label} — uploaded file "${file.name}" (${file.type || "unknown type"}, ${Math.round(file.size / 1024)} KB)\n` +
          `Submitted during review on ${today}.\n` +
          `Binary content is not parsed; the organisation name below was recorded at upload and the reviewer should verify the file visually.`;
      }
      onChange(
        evidence.map((e) =>
          e.kind === kind
            ? {
                ...e,
                status: "provided" as const,
                fileName: file.name,
                submittedAt: today,
                organisationName: applicantName,
                signatory:
                  kind === "responsible_person_signoff"
                    ? "Uploaded document — reviewer to verify signatory"
                    : e.signatory,
                content,
              }
            : e,
        ),
      );
    } catch {
      setUploadError(
        `Could not read “${file.name}”. Try another file or run Simulated upload.`,
      );
    } finally {
      setReadingFile(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const simulateUpload = (kind: EvidenceItem["kind"]) => {
    if (kind === "responsible_person_signoff") {
      onChange(
        evidence.map((e) =>
          e.kind === kind ? mockSignoffUpload(applicantName) : e,
        ),
      );
    } else {
      const today = new Date().toISOString().slice(0, 10);
      onChange(
        evidence.map((e) =>
          e.kind === kind
            ? {
                ...e,
                status: "provided" as const,
                fileName: `${kind}_${applicantName.replace(/\W+/g, "_")}.pdf`,
                submittedAt: today,
                organisationName: applicantName,
                content: `${e.label} — ${applicantName}\nProvided during review on ${today}.`,
              }
            : e,
        ),
      );
    }
  };

  const applyMismatchFix = () => {
    const name = fixedName.trim() || applicantName;
    onChange(
      evidence.map((e) =>
        e.kind === "registration_record"
          ? {
              ...e,
              organisationName: name,
              content:
                `REGISTRATION RECORD — ${name}\n` +
                `Registered provider (corrected during review).\n` +
                `Organisation name on record: ${name}.\nStatus: active.`,
            }
          : e,
      ),
    );
    setFixingMismatch(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence checklist</CardTitle>
        <CardDescription>
          3 required items. Upload a document for a missing item, or run the
          one simulated event — “Simulated upload” — which delivers
          the missing evidence and resets the next action without another
          prompt. Any evidence change marks the application as Analysis
          Required until re-analyzed.
        </CardDescription>
      </CardHeader>
      <input
        ref={fileInput}
        type="file"
        className="sr-only"
        aria-label="Choose evidence document to upload"
        accept=".pdf,.txt,.md,.markdown,.csv,.json,.log,.png,.jpg,.jpeg"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {uploadError ? (
        <p role="alert" className="px-5 text-xs text-destructive">
          {uploadError}
        </p>
      ) : null}
      <CardContent className="flex flex-col gap-3">
        {evidence.map((item) => {
          const complete = item.status === "provided";
          return (
            <div
              key={item.kind}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                  complete
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {complete ? (
                  <CheckCircle2 className="size-5" aria-hidden />
                ) : (
                  <XCircle className="size-5" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <Badge variant={complete ? "default" : "destructive"}>
                    {complete ? "Complete" : "Missing"}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {complete ? (
                    <>
                      <span className="block truncate">
                        {item.documentId ? `${item.documentId}, ` : null}
                        {item.fileName ?? "document"}
                        {item.submittedAt
                          ? `, submitted ${item.submittedAt}`
                          : null}
                      </span>
                      {item.organisationName ? (
                        <span className="block truncate">
                          Record name: {item.organisationName}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "Not yet provided by the applicant."
                  )}
                </div>
                {item.kind === "registration_record" &&
                complete &&
                item.organisationName &&
                item.organisationName.trim().toLowerCase() !==
                  applicantName.trim().toLowerCase() ? (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-800">
                    <AlertTriangle
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden
                    />
                    Name on this document (“{item.organisationName}”) differs
                    from the application (“{applicantName}”).
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {complete ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewing(item)}
                  >
                    <Eye data-icon="inline-start" aria-hidden /> View
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={readingFile}
                      onClick={() => startUpload(item.kind)}
                    >
                      <Upload data-icon="inline-start" aria-hidden /> Upload
                      document
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={readingFile}
                      onClick={() => simulateUpload(item.kind)}
                    >
                      <UploadCloud data-icon="inline-start" aria-hidden />{" "}
                      Simulated upload
                    </Button>
                  </>
                )}
                {item.kind === "registration_record" && complete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFixedName(applicantName);
                      setFixingMismatch(true);
                    }}
                  >
                    <FileText data-icon="inline-start" aria-hidden /> Correct
                    name
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}

        <Dialog
          open={viewing !== null}
          onOpenChange={(open) => {
            if (!open) setViewing(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {viewing ? `Document: ${viewing.label}` : "Document"}
              </DialogTitle>
              <DialogDescription>
                Document supplied with the application. Reviewer-uploaded files
                show extracted text when readable.
              </DialogDescription>
            </DialogHeader>
            {viewing ? (
              <div className="flex flex-col gap-2">
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <dt className="text-muted-foreground">Document ID</dt>
                  <dd className="font-mono font-medium">
                    {viewing.documentId ?? "Not assigned yet"}
                  </dd>
                  <dt className="text-muted-foreground">File</dt>
                  <dd className="font-medium">{viewing.fileName ?? "—"}</dd>
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd className="font-medium">{viewing.submittedAt ?? "—"}</dd>
                  <dt className="text-muted-foreground">Organisation</dt>
                  <dd className="font-medium">
                    {viewing.organisationName ?? "—"}
                  </dd>
                  {viewing.signatory ? (
                    <>
                      <dt className="text-muted-foreground">Signatory</dt>
                      <dd className="font-medium">{viewing.signatory}</dd>
                    </>
                  ) : null}
                </dl>
                <pre className="rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {viewing.content || "No content."}
                </pre>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={fixingMismatch} onOpenChange={setFixingMismatch}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Correct registration name</DialogTitle>
              <DialogDescription>
                Simulate the applicant providing a corrected registration
                record. This updates the document text that the AI analyzes.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="corrected-org-name">
                Organisation name on corrected record
              </FieldLabel>
              <Input
                id="corrected-org-name"
                value={fixedName}
                onChange={(e) => setFixedName(e.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setFixingMismatch(false)}>
                Cancel
              </Button>
              <Button onClick={applyMismatchFix}>Apply correction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
