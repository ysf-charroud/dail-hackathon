import type {
  AnalysisResult,
  ApplicationRecord,
} from "./types";
import { analyzeDeterministic } from "./analysis";

const BASE_URL =
  process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1";
const MODEL = process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";

function apiKey(): string | null {
  const k = process.env.OPENROUTER_API_KEY?.trim();
  return k ? k : null;
}

export function llmConfigured(): boolean {
  return apiKey() !== null;
}

const ANALYZE_SYSTEM = `You are an evidence-checking assistant for a human application reviewer.
Fixed required evidence (exactly these 3, never invent others):
1. registration_record 2. activity_plan 3. responsible_person_signoff
Rules:
- NEVER approve or reject the application. NEVER invent eligibility rules or evidence that was not provided.
- Report missing items. Compare applicantName to registration organisationName; flag mismatches and require human clarification.
- If uncertain, say human clarification is required.
- Respond with JSON ONLY, no markdown, matching this schema:
{"status":"missing_evidence"|"needs_clarification"|"review_ready","summary":"string","issues":[{"type":"missing_evidence"|"mismatch","field":"string","severity":"blocking"|"warning","message":"string","requiresHumanClarification":boolean,"applicationValue":"string (mismatch only)","evidenceValue":"string (mismatch only)"}]}
- status: missing_evidence if any required item missing; else needs_clarification if any mismatch; else review_ready.
- summary: 1-2 plain sentences for the reviewer.`;

const REQUEST_SYSTEM = `You draft short, polite messages from a human reviewer to an applicant requesting missing evidence or clarification.
Rules: NEVER approve or reject. Keep under 150 words. Plain text, no markdown headings. End by noting a human reviewer will assess the application once resolved.`;

async function chat(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const key = apiKey();
  if (!key) throw new Error("LLM not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://c07-hackathon.local",
        "X-Title": "C07 Evidence Review Prototype",
      },
      body: JSON.stringify({
        model: MODEL,
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
        evidence: app.evidence.map((e) => ({
          kind: e.kind,
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
