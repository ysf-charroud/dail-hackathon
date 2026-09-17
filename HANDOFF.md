# C07 Evidence Review — Handoff (2026-09-17)

## Problem
Human reviewers receive applications with supporting evidence and must quickly judge readiness: what is provided, what is missing, what is inconsistent, and what to ask the applicant. AI must assist only — never approve or reject.

## Prototype link
[<url>](https://dail-hackathon-9wekor8gv-youssef-chas-projects.vercel.app/)

## Auth + database (Supabase, live)
- Tables live in project `axsfzsldcbgsjnqytinl`: `profiles`, `applications`, `evidence_items`, `analyses`, `applicant_requests`. Migrations in `supabase/migrations/` (applied via MCP).
- Sign-in: email + password at `/login` (sign-in / create-account modes) → `/post-login` redirects reviewers to `/applications`, applicants to `/my-application`. New signups auto-become `applicant` (DB trigger); applicants cannot self-promote (RLS). If Supabase email confirmation is on, new accounts must follow the inbox link once (or disable confirmation in Auth settings for a frictionless demo).
- Signed-in reviewer flow reads/writes the DB (analyses + requests persisted); signed-out demo still runs on local seeds. Anon key in `.env` (git-ignored).
- TO FINISH ACCOUNTS: sign up once with the reviewer email via `/login`, then tell the agent to promote it (`profiles.role='reviewer'`) and link applicant emails to APP-1/APP-2 (`applications.owner_id`). No service-role key on file — user promotion done via MCP SQL.

## 3-minute demo
`/applications` → open APP-1 → Run AI Analysis (CONSENT-1 missing, blocking) → Generate request (one consolidated message) → **Simulate applicant reply** (the labelled simulated event) → status flips to Analysis Required → Re-analyze → Review Ready (green, 100%). APP-2 shows the uncertain path: REG-2 mismatch plus missing plan/signoff (3 issues), clarification required, never rejected. APP-3 is the clean reference case.

## What is real
- Deterministic evidence checker (`lib/analysis.ts`): missing-item + org-name mismatch detection, status derivation, request template, source-document linking (REG-1, PLAN-1, …).
- Hybrid LLM layer (`lib/llm.ts`, `app/api/*`): OpenRouter drafting/interpretation with deterministic fallback; LLM `review_ready` is vetoed when deterministic checks fail. LLM sees document IDs + locked reviewer notes.
- Seeds mirror published `initial.json` (APP-1/APP-2, NOTE-1 locked spelling correction); APP-3 is an extra synthetic fixture.
- UI: Next.js 16 App Router, shadcn/base-nova CLI components, semantic tokens. Signed-in reviewers read/write Supabase; signed-out demo runs on local seeds (localStorage `c07-apps-v2`).

## What is simulated
- All seed data is synthetic and fictional (labeled `Synthetic Data` in UI).
- Evidence upload is real client-side file picking (name + readable text extracted, ≤500 KB); binary files record metadata only. **Simulate applicant reply** is the one labelled simulated event delivering mock evidence.
- Applicant request Copy is a simulated send — nothing is emailed.
- Without `OPENROUTER_API_KEY`, analysis and drafts use the deterministic fallback (demo-safe).

## Open risks
- LLM path verified live via free interim model (`nvidia/nemotron-3-super-120b-a12b:free`, 2026-09-17): correct statuses, valid schema, polite drafts, no approve/reject language. Minor variance vs deterministic: mismatch severity `blocking` (not `warning`) and field `applicantName` (not `organisation_name`) — UI handles both. Not yet re-verified against the new published-data seeds + source IDs.
- Reviewer/applicant accounts still unprovisioned (signup + promotion pending).
- Parallel UI/landing agents are restructuring pages — coordinate before committing shared files.

## Next validation step
Team decision (2026-09-17): use **DeepSeek V4 Pro** via OpenRouter (`OPENROUTER_MODEL=deepseek/deepseek-v4-pro`, verified slug). Interim: free model `nvidia/nemotron-3-super-120b-a12b:free` in `.env` (works; LLM path verified on all 3 apps). NOTE: the DeepSeek key hit `403 Key limit exceeded` — add credits/raise the key limit at openrouter.ai/workspaces/default/keys before switching. Then set `OPENROUTER_API_KEY` in the deploy environment, run one live analysis per application, and confirm LLM output stays within the structured schema before presenting.
