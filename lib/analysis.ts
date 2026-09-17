import type {
  AnalysisIssue,
  AnalysisResult,
  ApplicationRecord,
} from "./types";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const EVIDENCE_LABEL: Record<string, string> = {
  registration_record: "registration record",
  activity_plan: "activity plan",
  responsible_person_signoff: "named responsible-person signoff",
};

/**
 * Deterministic checker for the 3 fixed evidence requirements.
 * Handles: missing items + organisation-name mismatch.
 * Never approves/rejects — only reports readiness + issues.
 */
export function analyzeDeterministic(app: ApplicationRecord): AnalysisResult {
  const issues: AnalysisIssue[] = [];

  for (const item of app.evidence) {
    if (item.status !== "provided") {
      const label = EVIDENCE_LABEL[item.kind] ?? item.label;
      const why =
        item.kind === "responsible_person_signoff"
          ? "A named responsible person must confirm the plan is accurate and delivery capacity is in place."
          : item.kind === "registration_record"
            ? "Registration confirms the applicant is a recognised provider."
            : "The activity plan describes what will be delivered, to whom, and when.";
      issues.push({
        type: "missing_evidence",
        field: item.kind,
        severity: "blocking",
        message: `The ${label} has not been provided. ${why}`,
        requiresHumanClarification: false,
        sourceDocumentId: item.documentId,
      });
    }
  }

  const registration = app.evidence.find(
    (e) => e.kind === "registration_record" && e.status === "provided",
  );
  if (
    registration?.organisationName &&
    norm(registration.organisationName) !== norm(app.applicantName)
  ) {
    issues.push({
      type: "mismatch",
      field: "organisation_name",
      applicationValue: app.applicantName,
      evidenceValue: registration.organisationName,
      severity: "warning",
      message:
        "The organisation name in the registration record does not match the applicant name on the application. Human clarification is required — this may be a typo, a renamed organisation, or a wrong document.",
      requiresHumanClarification: true,
      sourceDocumentId: registration.documentId,
    });
  }

  if (issues.length === 0) {
    return {
      status: "review_ready",
      summary:
        "All 3 required evidence items are present and the organisation name is consistent. The application is ready for human review. (AI does not approve or reject — the final decision belongs to a human reviewer.)",
      issues,
    };
  }

  const hasMissing = issues.some((i) => i.type === "missing_evidence");
  const status = hasMissing ? "missing_evidence" : "needs_clarification";
  const count = issues.length;
  const summary =
    status === "missing_evidence"
      ? `${count === 1 ? "1 issue" : `${count} issues`} found. A required evidence item is missing, so the application is not yet ready for human review.`
      : "The organisation name is inconsistent across the submitted evidence. Human clarification is required before the application can proceed.";

  return { status, summary, issues };
}

/** Deterministic fallback for the applicant request message. */
export function buildRequestTemplate(
  app: ApplicationRecord,
  analysis: AnalysisResult,
): string {
  const lines: string[] = [
    `Hello ${app.applicantName},`,
    ``,
    `Thank you for your application (${app.id}, ${app.programme}).`,
    ``,
  ];
  for (const issue of analysis.issues) {
    if (issue.type === "missing_evidence") {
      const label = EVIDENCE_LABEL[issue.field] ?? issue.field;
      lines.push(
        `• Your application is currently missing the ${label}. Please provide this evidence so the application can proceed to human review.`,
      );
    } else {
      lines.push(
        `• The organisation name on your application ("${issue.applicationValue}") does not match your registration record ("${issue.evidenceValue}"). Please clarify the correct registered name or provide the matching registration document.`,
      );
    }
  }
  lines.push(
    ``,
    `A human reviewer will assess your application once the above is resolved. This message does not approve or reject your application.`,
  );
  return lines.join("\n");
}
