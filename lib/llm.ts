import type {
  AnalysisResult,
  ApplicationRecord,
} from "./types";
import { analyzeDeterministic } from "./analysis";

interface Provider {
  key: string;
  baseUrl: string;
  model: string;
}

// Team decision (2026-09-17): DeepSeek direct API (deepseek-v4-pro).
// Falls back to OpenRouter when only OpenRouter credentials are set.
function provider(): Provider | null {
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseekKey) {
    return {
      key: deepseekKey,
      baseUrl:
        process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
      model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-pro",
    };
  }
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    return {
      key: openRouterKey,
      baseUrl:
        process.env.OPENROUTER_BASE_URL?.trim() ||
        "https://openrouter.ai/api/v1",
      model:
        process.env.OPENROUTER_MODEL?.trim() ||
        "nvidia/nemotron-3-super-120b-a12b:free",
    };
  }
  return null;
}

export function llmConfigured(): boolean {
  return provider() !== null;
}

const ANALYZE_SYSTEM = `You are an evidence-checking assistant for a human application reviewer.
Fixed required evidence (exactly these 3, never invent others):
1. registration_record 2. activity_plan 3. responsible_person_signoff
Rules:
- NEVER approve or reject the application. NEVER invent eligibility rules or evidence that was not provided.
- Report missing items. Compare applicantName to registration organisationName; flag mismatches and require human clarification.
- Respect locked reviewer notes (authoritative corrections — e.g. keep the supplied organisation spelling).
- Cite the source document ID (REG-1, PLAN-1, …) in each issue as "sourceDocumentId" when one applies.
- If uncertain, say human clarification is required.
- Respond with JSON ONLY, no markdown, matching this schema:
{"status":"missing_evidence"|"needs_clarification"|"review_ready","summary":"string","issues":[{"type":"missing_evidence"|"mismatch","field":"string","severity":"blocking"|"warning","message":"string","requiresHumanClarification":boolean,"applicationValue":"string (mismatch only)","evidenceValue":"string (mismatch only)","sourceDocumentId":"string (when one applies)"}]}
- status: missing_evidence if any required item missing; else needs_clarification if any mismatch; else review_ready.
- summary: 1-2 plain sentences for the reviewer.`;

const REQUEST_SYSTEM = `You draft short, formal messages from a programme caseworker at a German charitable foundation to an applicant requesting missing evidence or clarification.
Register: formal, respectful, precise. Address the applicant as "Dear <name>". Frame every point as guidance toward a complete, review-ready file — never as a verdict. Name each missing document and, for mismatches, quote both conflicting values and ask which is correct.
Rules: NEVER approve or reject. NEVER imply a funding decision. Keep under 150 words. Plain text, no markdown headings. Close by noting a programme caseworker will review the file once complete.`;

async function chat(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const p = provider();
  if (!p) throw new Error("LLM not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${p.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.key}`,
      },
      body: JSON.stringify({
        model: p.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Empty LLM response");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("No JSON in LLM response");
  }
}

function isValidAnalysis(v: unknown): v is AnalysisResult {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  if (
    o.status !== "missing_evidence" &&
    o.status !== "needs_clarification" &&
    o.status !== "review_ready"
  )
    return false;
  if (typeof o.summary !== "string" || !Array.isArray(o.issues)) return false;
  return true;
}

/** Hybrid: LLM interpretation, deterministic fallback so demo never breaks. */
export async function analyzeWithLlm(
  app: ApplicationRecord,
): Promise<{ analysis: AnalysisResult; source: "llm" | "deterministic" }> {
  const fallback = analyzeDeterministic(app);
  if (!llmConfigured()) return { analysis: fallback, source: "deterministic" };
  try {
    const user = JSON.stringify(
      {
        applicantName: app.applicantName,
        programme: app.programme,
        reviewerNotes: (app.reviewerNotes ?? []).map((n) => ({
          id: n.id,
          text: n.text,
          locked: n.locked,
        })),
        evidence: app.evidence.map((e) => ({
          kind: e.kind,
          documentId: e.documentId ?? null,
          status: e.status,
          organisationName: e.organisationName ?? null,
          signatory: e.signatory ?? null,
          content: e.content ?? "",
        })),
      },
      null,
      2,
    );
    const text = await chat(ANALYZE_SYSTEM, user, 800);
    const parsed = extractJson(text);
    if (!isValidAnalysis(parsed)) throw new Error("Invalid analysis shape");
    // Safety: never trust an LLM "review_ready" when deterministic checks fail.
    if (fallback.status !== "review_ready" && parsed.status === "review_ready") {
      return { analysis: fallback, source: "deterministic" };
    }
    return { analysis: parsed, source: "llm" };
  } catch {
    return { analysis: fallback, source: "deterministic" };
  }
}

export async function draftRequestWithLlm(
  app: ApplicationRecord,
  analysis: AnalysisResult,
  templateFallback: string,
): Promise<{ message: string; source: "llm" | "deterministic" }> {
  if (!llmConfigured()) return { message: templateFallback, source: "deterministic" };
  try {
    const text = await chat(
      REQUEST_SYSTEM,
      `Application ${app.id} from ${app.applicantName} (${app.programme}).\nAnalysis summary: ${analysis.summary}\nIssues: ${JSON.stringify(analysis.issues)}`,
      400,
    );
    const msg = text.replace(/^```[\s\S]*?\n/, "").replace(/```$/, "").trim();
    if (msg.length < 20) throw new Error("Too short");
    return { message: msg, source: "llm" };
  } catch {
    return { message: templateFallback, source: "deterministic" };
  }
}
