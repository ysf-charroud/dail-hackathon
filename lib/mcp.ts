import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { buildRequestTemplate } from "./analysis";
import { SEED_APPLICATIONS } from "./data";
import { analyzeWithLlm, draftRequestWithLlm } from "./llm";
import type { AnalysisResult, ApplicationRecord } from "./types";

export const C07_SERVER_NAME = "c07-evidence-mcp-server";
export const C07_SERVER_VERSION = "0.1.0";

const ResponseFormat = z.enum(["markdown", "json"]);
type ResponseFormat = z.infer<typeof ResponseFormat>;

const formatField = ResponseFormat.default("markdown").describe(
  "Output format: 'markdown' for human-readable text, 'json' for structured data.",
);

const ListInput = z.strictObject({
  limit: z.number().int().min(1).max(100).default(20).describe("Max applications to return (1-100)."),
  offset: z.number().int().min(0).default(0).describe("Applications to skip for pagination."),
  response_format: formatField,
});

const IdInput = z.strictObject({
  id: z.string().min(1).max(20).describe("Application id, e.g. 'APP-1'."),
  response_format: formatField,
});

function findApp(id: string): ApplicationRecord | undefined {
  return SEED_APPLICATIONS.find(
    (a) => a.id.toLowerCase() === id.trim().toLowerCase(),
  );
}

function unknownIdError(id: string): string {
  return `Error: Unknown application id '${id}'. Valid ids are APP-1, APP-2, APP-3. Call c07_list_applications first to browse them.`;
}

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
    `- Source: ${source === "llm" ? "AI-assisted (OpenRouter) + deterministic safety net" : "deterministic checker"}`,
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

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

/**
 * Register the 4 C07 evidence-review tools on an MCP server.
 * Shared by the hosted /api/mcp route (other LLMs call this over HTTP).
 * All tools are read-only: they analyze and draft, never persist or send.
 */
export function registerC07Tools(server: McpServer): void {
  server.registerTool(
    "c07_list_applications",
    {
      title: "List C07 applications",
      description: `List synthetic funding applications in the C07 evidence-review prototype (read-only). Returns id, applicant, programme and completion %. Use this first to get valid APP-xxx ids. Do not use for analysis — use c07_analyze_evidence instead.`,
      inputSchema: ListInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ limit, offset, response_format }) => {
      const total = SEED_APPLICATIONS.length;
      const slice = SEED_APPLICATIONS.slice(offset, offset + limit);
      const applications = slice.map((a) => ({
        id: a.id,
        applicantName: a.applicantName,
        programme: a.programme,
        submittedAt: a.submittedAt,
        completionPercent: completion(a),
      }));
      if (response_format === "json") {
        return textResult(
          JSON.stringify(
            {
              total,
              count: applications.length,
              offset,
              has_more: offset + slice.length < total,
              ...(offset + slice.length < total
                ? { next_offset: offset + slice.length }
                : {}),
              applications,
            },
            null,
            2,
          ),
        );
      }
      return textResult(
        [
          `# C07 applications (${applications.length}/${total})`,
          ``,
          `> Synthetic Data — fictional seeds for demo only.`,
          ``,
          ...slice.map((a) => appCard(a)),
        ].join("\n\n"),
      );
    },
  );

  server.registerTool(
    "c07_get_application",
    {
      title: "Get C07 application detail",
      description: `Get one synthetic application with full evidence items (read-only). Pass the APP-xxx id from c07_list_applications, e.g. {"id": "APP-2"}.`,
      inputSchema: IdInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id, response_format }) => {
      const app = findApp(id);
      if (!app) return { ...textResult(unknownIdError(id)), isError: true };
      if (response_format === "json") {
        return textResult(JSON.stringify({ application: app }, null, 2));
      }
      return textResult(
        [
          appCard(app),
          ``,
          `## Evidence detail`,
          ...app.evidence.map(
            (e) =>
              `### ${e.label} — ${e.status}\n${e.fileName ? `- File: ${e.fileName}\n` : ""}${e.organisationName ? `- Org: ${e.organisationName}\n` : ""}${e.signatory ? `- Signed: ${e.signatory}\n` : ""}${e.content ? `\n> ${e.content.split("\n").join("\n> ")}` : "_No document provided._"}`,
          ),
          ``,
          `> Synthetic Data — fictional seed content.`,
        ].join("\n"),
      );
    },
  );

  server.registerTool(
    "c07_analyze_evidence",
    {
      title: "Analyze C07 application evidence",
      description: `Run evidence analysis for one application (read-only). APP-1 is missing its signoff (expect missing_evidence), APP-2 has an org-name mismatch plus missing items (expect missing_evidence), APP-3 is complete (expect review_ready). AI never approves or rejects — tools only report readiness and issues.`,
      inputSchema: IdInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id, response_format }) => {
      const app = findApp(id);
      if (!app) return { ...textResult(unknownIdError(id)), isError: true };
      const { analysis, source } = await analyzeWithLlm(app);
      const output = { applicationId: app.id, source, ...analysis };
      if (response_format === "json") {
        return textResult(JSON.stringify(output, null, 2));
      }
      return textResult(analysisCard(app, analysis, source));
    },
  );

  server.registerTool(
    "c07_draft_applicant_request",
    {
      title: "Draft C07 applicant request",
      description: `Draft a polite applicant message requesting missing evidence or clarification (read-only: drafts text, sends nothing). Analyzes the app first, then drafts from the detected issues. Never approves or rejects.`,
      inputSchema: IdInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id, response_format }) => {
      const app = findApp(id);
      if (!app) return { ...textResult(unknownIdError(id)), isError: true };
      const { analysis } = await analyzeWithLlm(app);
      const template = buildRequestTemplate(app, analysis);
      const { message, source } = await draftRequestWithLlm(
        app,
        analysis,
        template,
      );
      const output = {
        applicationId: app.id,
        analysisStatus: analysis.status,
        source,
        message,
      };
      if (response_format === "json") {
        return textResult(JSON.stringify(output, null, 2));
      }
      return textResult(
        [
          `# Draft request: ${app.applicantName} (${app.id})`,
          ``,
          `> Synthetic Data — draft only, nothing is sent. Source: ${source}.`,
          ``,
          message,
          ``,
          `_Analysis status: ${analysis.status}. AI never approves or rejects._`,
        ].join("\n"),
      );
    },
  );
}
