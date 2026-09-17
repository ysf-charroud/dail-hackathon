export type ReviewStatus =
  | "analysis_required"
  | "missing_evidence"
  | "needs_clarification"
  | "review_ready";

export type EvidenceKind =
  | "registration_record"
  | "activity_plan"
  | "responsible_person_signoff";

export interface EvidenceItem {
  kind: EvidenceKind;
  label: string;
  status: "provided" | "missing";
  /** Published source-document ID (REG-1, PLAN-1, …). Missing docs may have none yet. */
  documentId?: string;
  fileName?: string;
  submittedAt?: string;
  organisationName?: string;
  signatory?: string;
  /** Short realistic mock document body shown in the viewer + sent to the AI. */
  content?: string;
}

export interface ReviewerNote {
  id: string;
  text: string;
  locked: boolean;
}

export interface ApplicationRecord {
  id: string;
  applicantName: string;
  programme: string;
  submittedAt: string;
  contact: string;
  summary: string;
  evidence: EvidenceItem[];
  reviewerNotes?: ReviewerNote[];
}

export type IssueType = "missing_evidence" | "mismatch";

export interface AnalysisIssue {
  type: IssueType;
  field: string;
  severity: "blocking" | "warning";
  message: string;
  requiresHumanClarification: boolean;
  applicationValue?: string;
  evidenceValue?: string;
  /** Source document this issue links to (REG-1, PLAN-1, …), if any. */
  sourceDocumentId?: string;
}

export interface AnalysisResult {
  status: Exclude<ReviewStatus, "analysis_required">;
  summary: string;
  issues: AnalysisIssue[];
}

export interface StoredAnalysis extends AnalysisResult {
  source: "llm" | "deterministic";
  analyzedAt: string;
}

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  analysis_required: "Analysis Required",
  missing_evidence: "Missing Evidence",
  needs_clarification: "Needs Clarification",
  review_ready: "Review Ready",
};

export const REQUIRED_EVIDENCE: { kind: EvidenceKind; label: string }[] = [
  { kind: "registration_record", label: "Registration record" },
  { kind: "activity_plan", label: "Activity plan" },
  { kind: "responsible_person_signoff", label: "Responsible-person signoff" },
];

/** completed required items / 3, rounded to 0 / 33 / 67 / 100 */
export function completionPercent(app: ApplicationRecord): number {
  const done = app.evidence.filter((e) => e.status === "provided").length;
  return Math.round((done / REQUIRED_EVIDENCE.length) * 100);
}
