#!/usr/bin/env node
/**
 * c07-evidence-mcp-server
 *
 * Exposes the C07 evidence-review prototype to other LLMs (Claude Desktop,
 * MCP Inspector, VS Code, …) as 4 minimal tools:
 *   c07_list_applications, c07_get_application,
 *   c07_analyze_evidence, c07_draft_applicant_request
 *
 * Data strategy (per user choice): Live Next.js API first, deterministic
 * fallback so the demo never breaks. Seeds mirror lib/data.ts (synthetic).
 * AI never approves/rejects — tools only report readiness + issues.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

// ---------------------------------------------------------------- constants

const SERVER_NAME = "c07-evidence-mcp-server";
const SERVER_VERSION = "0.1.0";
const CHARACTER_LIMIT = 25000;
const BASE_URL =
  process.env.C07_BASE_URL?.trim() || "http://localhost:3000";
const FETCH_TIMEOUT_MS = 12000;

enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

// ------------------------------------------------------------------- types

type EvidenceStatus = "provided" | "missing";

interface EvidenceItem {
  kind: "registration_record" | "activity_plan" | "responsible_person_signoff";
  label: string;
  status: EvidenceStatus;
  fileName?: string;
  submittedAt?: string;
  organisationName?: string;
  signatory?: string;
  content?: string;
}

interface ApplicationRecord {
  id: string;
  applicantName: string;
  programme: string;
  submittedAt: string;
  contact: string;
  summary: string;
  evidence: EvidenceItem[];
}

interface AnalysisIssue {
  type: "missing_evidence" | "mismatch";
  field: string;
  severity: "blocking" | "warning";
  message: string;
  requiresHumanClarification: boolean;
  applicationValue?: string;
  evidenceValue?: string;
}

interface AnalysisResult {
  status: "missing_evidence" | "needs_clarification" | "review_ready";
  summary: string;
  issues: AnalysisIssue[];
}

// ------------------------------------------------- seeds (mirror lib/data.ts)

const SEEDS: ApplicationRecord[] = [
  {
    id: "APP-101",
    applicantName: "Learning Workshop A",
    programme: "Vocational pilot",
    submittedAt: "2026-09-02",
    contact: "coordinator@example.org",
    summary:
      "Six-week vocational pilot: workshop safety, tool handling and supervised practice sessions for 24 learners.",
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        fileName: "registration-record_LWA.pdf",
        submittedAt: "2026-09-02",
        organisationName: "Learning Workshop A",
        content:
          "REGISTRATION RECORD — Learning Workshop A\nRegistered training provider no. LWA-2024-118.\nOrganisation name on record: Learning Workshop A.\nStatus: active. Valid through 2027-03-31.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "provided",
        fileName: "activity-plan_LWA.pdf",
        submittedAt: "2026-09-02",
        organisationName: "Learning Workshop A",
        content:
          "ACTIVITY PLAN — Learning Workshop A (Vocational pilot)\n6 weekly sessions, max 24 learners, 2 trainers.\nVenue: Unit 4, Foundry Lane. Risk assessment attached.\nPlanned start: 2026-10-06.",
      },
      {
        kind: "responsible_person_signoff",
        label: "Responsible-person signoff",
        status: "missing",
        content: "",
      },
    ],
  },
  {
    id: "APP-102",
    applicantName: "Community Workshop B",
    programme: "Trainer development",
    submittedAt: "2026-09-05",
    contact: "hello@example.org",
    summary:
      "Trainer development pathway: mentoring, observed delivery and peer review for 8 trainee trainers.",
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        fileName: "registration-record_CWB.pdf",
        submittedAt: "2026-09-05",
        organisationName: "Community Workshop C",
        content:
          "REGISTRATION RECORD — Community Workshop C\nRegistered community provider no. CWC-2023-042.\nOrganisation name on record: Community Workshop C.\nStatus: active. Valid through 2026-12-31.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "provided",
        fileName: "activity-plan_CWB.pdf",
        submittedAt: "2026-09-05",
        organisationName: "Community Workshop B",
        content:
          "ACTIVITY PLAN — Community Workshop B (Trainer development)\n8 trainee trainers, 10 weeks, observed delivery x3.\nLead mentor named. Planned start: 2026-10-13.",
      },
      {
        kind: "responsible_person_signoff",
        label: "Responsible-person signoff",
        status: "provided",
        fileName: "signoff_CWB.pdf",
        submittedAt: "2026-09-05",
        organisationName: "Community Workshop B",
        signatory: "R. Okafor, Programme Lead",
        content:
          "RESPONSIBLE-PERSON SIGNOFF — Community Workshop B\nI confirm the trainer development plan is accurate and delivery capacity is in place.\nSigned: R. Okafor, Programme Lead, 2026-09-04.",
      },
    ],
  },
  {
    id: "APP-103",
    applicantName: "Northgate Skills Collective",
    programme: "Vocational pilot",
    submittedAt: "2026-09-08",
    contact: "admin@example.org",
    summary:
      "Weekend vocational taster series: three cohorts, introductory bench skills and progression advice.",
    evidence: [
      {
        kind: "registration_record",
        label: "Registration record",
        status: "provided",
        fileName: "registration-record_NSC.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        content:
          "REGISTRATION RECORD — Northgate Skills Collective\nRegistered training provider no. NSC-2025-009.\nOrganisation name on record: Northgate Skills Collective.\nStatus: active. Valid through 2027-06-30.",
      },
      {
        kind: "activity_plan",
        label: "Activity plan",
        status: "provided",
        fileName: "activity-plan_NSC.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        content:
          "ACTIVITY PLAN — Northgate Skills Collective (Vocational pilot)\n3 weekend cohorts of 16 learners. Staffing 1:8.\nVenue booked. Planned start: 2026-10-18.",
      },
      {
        kind: "responsible_person_signoff",
        label: "Responsible-person signoff",
        status: "provided",
        fileName: "signoff_NSC.pdf",
        submittedAt: "2026-09-08",
        organisationName: "Northgate Skills Collective",
        signatory: "J. Whitfield, Responsible Person",
        content:
          "RESPONSIBLE-PERSON SIGNOFF — Northgate Skills Collective\nI confirm the activity plan and staffing for the vocational pilot.\nSigned: J. Whitfield, Responsible Person, 2026-09-07.",
      },
    ],
  },
];

// ------------------------------------------- deterministic fallback (lib/analysis.ts)

const norm = (s: string): string =>
  s.trim().toLowerCase().replace(/\s+/g, " ");

const EVIDENCE_LABEL: Record<string, string> = {
  registration_record: "registration record",
  activity_plan: "activity plan",
  responsible_person_signoff: "named responsible-person signoff",
};

function analyzeDeterministic(app: ApplicationRecord): AnalysisResult {
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

function buildRequestTemplate(
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

// ------------------------------------------------------------ live API layer

async function postJson<T>(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; data: T | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, data: null };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, data: null };
  } finally {
    clearTimeout(timer);
  }
}

function findApp(id: string): ApplicationRecord | undefined {
  return SEEDS.find((a) => a.id.toLowerCase() === id.trim().toLowerCase());
}

function unknownIdError(id: string): string {
  return `Error: Unknown application id '${id}'. Valid ids are APP-101, APP-102, APP-103. Call c07_list_applications first to browse them.`;
}

// --------------------------------------------------------------- formatting

function completion(app: ApplicationRecord): number {
  const done = app.evidence.filter((e) => e.status === "provided").length;
  return Math.round((done / 3) * 100);
}

function appCard(app: ApplicationRecord): string {
  const ev = app.evidence
    .map((e) => `  - ${e.label}: ${e.status}`)
    .join("\n");
  return [
    `## ${app.applicantName} (${app.id})`,
    `- Programme: ${app.programme}`,
    `- Submitted: ${app.submittedAt}`,
    `- Completion: ${completion(app)}% (${app.evidence.filter((e) => e.status === "provided").length}/3)`,
    `- Evidence:`,
    ev,
    ``,
    `_${app.summary}_`,
  ].join("\n");
}

function analysisCard(
  app: ApplicationRecord,
  analysis: AnalysisResult,
  source: string,
): string {
  const lines = [
    `# Analysis: ${app.applicantName} (${app.id})`,
    ``,
    `> Synthetic Data — fictional seed content for demo only.`,
    ``,
    `- Status: **${analysis.status}**`,
    `- Source: ${source === "live" ? `live API (${BASE_URL})` : "deterministic fallback (Next.js app offline)"}`,
    `- Summary: ${analysis.summary}`,
    ``,
  ];
  if (analysis.issues.length === 0) {
    lines.push(`No issues. Ready for human review.`);
  } else {
    lines.push(`## Issues (${analysis.issues.length})`);
    for (const [i, issue] of analysis.issues.entries()) {
      lines.push(
        `${i + 1}. [${issue.severity}] ${issue.type} — ${issue.field}: ${issue.message}`,
      );
    }
  }
  lines.push(
    ``,
    `_AI never approves or rejects — final decision belongs to a human reviewer._`,
  );
  return lines.join("\n");
}

function truncate(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return (
    text.slice(0, CHARACTER_LIMIT) +
    `\n\n…[truncated at ${CHARACTER_LIMIT} chars]`
  );
}

// ------------------------------------------------------------------ schemas

const responseFormatField = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("Output format: 'markdown' for pitch-readable text, 'json' for structured data.");

const ListInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(20).describe("Max applications to return (1-100)."),
    offset: z.number().int().min(0).default(0).describe("Number of applications to skip for pagination."),
    response_format: responseFormatField,
  })
  .strict();

const GetInput = z
  .object({
    id: z.string().min(1).max(20).describe("Application id, e.g. 'APP-101'."),
    response_format: responseFormatField,
  })
  .strict();

const AnalyzeInput = z
  .object({
    id: z.string().min(1).max(20).describe("Application id to analyze, e.g. 'APP-102'."),
    response_format: responseFormatField,
  })
  .strict();

const DraftInput = z
  .object({
    id: z.string().min(1).max(20).describe("Application id to draft an applicant request for."),
    response_format: responseFormatField,
  })
  .strict();

type ListParams = z.infer<typeof ListInput>;
type GetParams = z.infer<typeof GetInput>;
type AnalyzeParams = z.infer<typeof AnalyzeInput>;
type DraftParams = z.infer<typeof DraftInput>;

// ------------------------------------------------------------------- server

const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

server.registerTool(
  "c07_list_applications",
  {
    title: "List C07 applications",
    description: `List synthetic funding applications in the C07 evidence-review prototype (read-only).

Args:
  - limit (number 1-100, default 20): max apps to return
  - offset (number, default 0): apps to skip
  - response_format ('markdown' | 'json', default 'markdown')

Returns markdown cards (id, applicant, programme, completion %) or JSON with {total,count,offset,has_more,next_offset,applications}.

Examples:
  - "Show me all applications" -> {} (defaults list all 3 seeds)
  - Don't use for analysis — use c07_analyze_evidence instead.

Errors: invalid pagination returns a hint with valid ranges.`,
    inputSchema: ListInput,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ limit, offset, response_format }: ListParams) => {
    const total = SEEDS.length;
    const slice = SEEDS.slice(offset, offset + limit);
    const output = {
      total,
      count: slice.length,
      offset,
      has_more: offset + slice.length < total,
      ...(offset + slice.length < total
        ? { next_offset: offset + slice.length }
        : {}),
      applications: slice.map((a) => ({
        id: a.id,
        applicantName: a.applicantName,
        programme: a.programme,
        submittedAt: a.submittedAt,
        completionPercent: completion(a),
      })),
    };
    const text =
      response_format === ResponseFormat.JSON
        ? JSON.stringify(output, null, 2)
        : [
            `# C07 applications (${output.count}/${total})`,
            ``,
            `> Synthetic Data — fictional seeds for demo only.`,
            ``,
            ...slice.map((a) => appCard(a)),
          ].join("\n\n");
    return {
      content: [{ type: "text", text: truncate(text) }],
      structuredContent: output,
    };
  },
);

server.registerTool(
  "c07_get_application",
  {
    title: "Get C07 application detail",
    description: `Get one synthetic application with full evidence items (read-only).

Args:
  - id (string): e.g. 'APP-101'
  - response_format ('markdown' | 'json', default 'markdown')

Returns the application record including evidence status, organisation names, and document excerpts.

Examples:
  - "Show APP-102 detail" -> {id:"APP-102"}
  - Don't use an applicant name here — use the APP-xxx id from c07_list_applications.

Errors: unknown id suggests calling c07_list_applications.`,
    inputSchema: GetInput,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ id, response_format }: GetParams) => {
    const app = findApp(id);
    if (!app) {
      return {
        isError: true,
        content: [{ type: "text", text: unknownIdError(id) }],
      };
    }
    const text =
      response_format === ResponseFormat.JSON
        ? JSON.stringify({ application: app }, null, 2)
        : [
            appCard(app),
            ``,
            `## Evidence detail`,
            ...app.evidence.map(
              (e) =>
                `### ${e.label} — ${e.status}\n${e.fileName ? `- File: ${e.fileName}\n` : ""}${e.organisationName ? `- Org: ${e.organisationName}\n` : ""}${e.signatory ? `- Signed: ${e.signatory}\n` : ""}${e.content ? `\n> ${e.content.split("\n").join("\n> ")}` : "_No document provided._"}`,
            ),
            ``,
            `> Synthetic Data — fictional seed content.`,
          ].join("\n");
    return {
      content: [{ type: "text", text: truncate(text) }],
      structuredContent: { application: app },
    };
  },
);

server.registerTool(
  "c07_analyze_evidence",
  {
    title: "Analyze C07 application evidence",
    description: `Run evidence analysis for one application via the live Next.js /api/analyze route, with deterministic fallback when the app is offline (read-only).

Args:
  - id (string): e.g. 'APP-101' (missing signoff), 'APP-102' (name mismatch), 'APP-103' (review-ready)
  - response_format ('markdown' | 'json', default 'markdown')

Returns {status, summary, issues[], source: 'live'|'deterministic'|'live-llm'|'live-deterministic'}. status is missing_evidence | needs_clarification | review_ready. AI never approves/rejects.

Examples:
  - "Analyze APP-101" -> {id:"APP-101"} (expect missing_evidence)
  - "Which apps are review ready?" -> analyze APP-103 (expect review_ready)

Errors: unknown id suggests c07_list_applications; live-API failure automatically falls back (source='deterministic').`,
    inputSchema: AnalyzeInput,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ id, response_format }: AnalyzeParams) => {
    const app = findApp(id);
    if (!app) {
      return {
        isError: true,
        content: [{ type: "text", text: unknownIdError(id) }],
      };
    }
    const live = await postJson<
      AnalysisResult & { source?: string }
    >("/api/analyze", { application: app });
    let analysis: AnalysisResult;
    let source: string;
    if (live.ok && live.data && typeof live.data.summary === "string") {
      analysis = {
        status: live.data.status,
        summary: live.data.summary,
        issues: Array.isArray(live.data.issues) ? live.data.issues : [],
      };
      source = live.data.source === "llm" ? "live-llm" : "live";
    } else {
      analysis = analyzeDeterministic(app);
      source = "deterministic";
    }
    const output = { applicationId: app.id, source, ...analysis };
    const text =
      response_format === ResponseFormat.JSON
        ? JSON.stringify(output, null, 2)
        : analysisCard(app, analysis, source);
    return {
      content: [{ type: "text", text: truncate(text) }],
      structuredContent: output,
    };
  },
);

server.registerTool(
  "c07_draft_applicant_request",
  {
    title: "Draft C07 applicant request",
    description: `Draft a polite applicant message requesting missing evidence / clarification via live /api/draft-request, with template fallback (read-only: drafts text, sends nothing).

Args:
  - id (string): e.g. 'APP-102'
  - response_format ('markdown' | 'json', default 'markdown')

Flow: analyzes the app first, then drafts. Returns {message, analysisStatus, source}. For review_ready apps the message notes readiness instead. Never approves/rejects.

Examples:
  - "Draft a request for APP-101" -> {id:"APP-101"} (asks for signoff)
  - Don't use to send email — copy the drafted text into the Review UI.

Errors: unknown id suggests c07_list_applications; offline app falls back to deterministic template.`,
    inputSchema: DraftInput,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ id, response_format }: DraftParams) => {
    const app = findApp(id);
    if (!app) {
      return {
        isError: true,
        content: [{ type: "text", text: unknownIdError(id) }],
      };
    }
    // Analyze first (live, else fallback) so the draft matches current state.
    const liveAnalysis = await postJson<
      AnalysisResult & { source?: string }
    >("/api/analyze", { application: app });
    const analysis: AnalysisResult =
      liveAnalysis.ok && liveAnalysis.data && typeof liveAnalysis.data.summary === "string"
        ? {
            status: liveAnalysis.data.status,
            summary: liveAnalysis.data.summary,
            issues: Array.isArray(liveAnalysis.data.issues)
              ? liveAnalysis.data.issues
              : [],
          }
        : analyzeDeterministic(app);
    const fallback = buildRequestTemplate(app, analysis);
    const liveDraft = await postJson<{ message?: string; source?: string }>(
      "/api/draft-request",
      { application: app, analysis },
    );
    const message =
      liveDraft.ok &&
      liveDraft.data &&
      typeof liveDraft.data.message === "string" &&
      liveDraft.data.message.length >= 20
        ? liveDraft.data.message
        : fallback;
    const source =
      liveDraft.ok && liveDraft.data?.message
        ? (liveDraft.data.source === "llm" ? "live-llm" : "live")
        : "deterministic";
    const output = {
      applicationId: app.id,
      analysisStatus: analysis.status,
      source,
      message,
    };
    const text =
      response_format === ResponseFormat.JSON
        ? JSON.stringify(output, null, 2)
        : [
            `# Draft request: ${app.applicantName} (${app.id})`,
            ``,
            `> Synthetic Data — draft only, nothing is sent. Source: ${source}.`,
            ``,
            message,
            ``,
            `_Analysis status: ${analysis.status}. AI never approves or rejects._`,
          ].join("\n");
    return {
      content: [{ type: "text", text: truncate(text) }],
      structuredContent: output,
    };
  },
);

// ------------------------------------------------------------------ runners

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] running via stdio (C07_BASE_URL=${BASE_URL})`);
}

async function runHttp(): Promise<void> {
  const app = express();
  app.use(express.json());
  app.get("/health", (_req, res) => {
    res.json({ ok: true, server: SERVER_NAME, version: SERVER_VERSION });
  });
  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request error:", err);
      if (!res.headersSent) res.status(500).json({ error: "MCP request failed" });
    }
  });
  const port = parseInt(process.env.PORT || "3001", 10);
  app.listen(port, () => {
    console.error(`[${SERVER_NAME}] Streamable HTTP on http://localhost:${port}/mcp`);
  });
}

const wantsHttp =
  process.argv.includes("--http") || process.env.TRANSPORT === "http";
if (wantsHttp) {
  runHttp().catch((err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
} else {
  runStdio().catch((err) => {
    console.error("Server error:", err);
    process.exit(1);
  });
}
