# C07 Evidence Review — Handoff (2026-09-17)

## Problem
Human reviewers receive applications with supporting evidence and must quickly judge readiness: what is provided, what is missing, what is inconsistent, and what to ask the applicant. AI must assist only — never approve or reject.

## Prototype link
[<url>](https://dail-hackathon-9wekor8gv-youssef-chas-projects.vercel.app/)

## 3-minute demo
`/` → open APP-101 → Run AI Analysis (missing signoff, blocking) → Generate request → Simulate upload → status flips to Analysis Required → Re-analyze → Review Ready (green, 100%). APP-102 shows the mismatch path (B vs. C, amber, 100% complete but blocked). APP-103 is the clean reference case.

## What is real
- Deterministic evidence checker (`lib/analysis.ts`): missing-item + org-name mismatch detection, status derivation, request template.
- Hybrid LLM layer (`lib/llm.ts`, `app/api/*`): OpenRouter drafting/interpretation with deterministic fallback; LLM `review_ready` is vetoed when deterministic checks fail.
- UI: Next.js 16 App Router, shadcn/base-nova CLI components, semantic tokens, localStorage persistence (`c07-apps-v1`).

## What is simulated
- All data is synthetic and fictional (labeled `Synthetic Data` in UI).
- Evidence "upload" and registration-name correction are simulated buttons writing mock document text.
- Applicant request is a draft with Copy — nothing is actually sent.
- Without `OPENROUTER_API_KEY`, analysis and drafts use the deterministic fallback (demo-safe).

## Open risks
- LLM path verified live on all 3 apps via free interim model (`nvidia/nemotron-3-super-120b-a12b:free`, 2026-09-17): correct statuses, valid schema, polite drafts, no approve/reject language. Minor variance vs deterministic: mismatch severity `blocking` (not `warning`) and field `applicantName` (not `organisation_name`) — UI handles both.
- Still untested with the team-decision model (DeepSeek V4). Swap `OPENROUTER_MODEL` in `.env` when the key arrives and re-run one analysis per app.
- No auth, no backend — reviewer state lives in browser localStorage only.

## Next validation step
Team decision (2026-09-17): use **DeepSeek V4** via OpenRouter (`OPENROUTER_MODEL=deepseek/deepseek-v4` in `.env.example` — verify the exact slug at https://openrouter.ai/models). Set `OPENROUTER_API_KEY` in the deploy environment, run one live analysis per application, and confirm LLM output stays within the structured schema before presenting.
