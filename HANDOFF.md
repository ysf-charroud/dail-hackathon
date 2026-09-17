# C07 Evidence Review — Handoff (2026-09-17)

## Assigned client (exercise only, unendorsed)
Schmitz-Stiftungen (Düsseldorf foundation, 25+ years funding education/self-help projects; ref https://www.schmitz-stiftungen.de/de/schmitz-stiftungen/ueber-uns/). Target users: foundation programme caseworkers + applicants receiving evidence requests. Fit choices: institutional navy theme, formal guidance register in the applicant request ("Dear…", guidance toward a complete file, never a verdict — in the spirit of help-toward-self-help), mismatch framed as a clarification question per RULE-2, human approval kept visible throughout. UI landing/header owned by parallel agents — client attribution there is theirs to add.
- Design system update (2026-09-17): primary deepened from bright SaaS blue to institutional navy (`--primary` oklch(0.42 0.14 264), ring/charts/sidebar follow); leaf-green `--foundation` accent sampled from the client logo mark; logo at `public/images/schmitz-stiftungen-logo.jpg`, shown on `/login` with an unendorsed-exercise caption.
- V2 visual pass (2026-09-17): primary is now foundation green (`--primary` oklch(0.46 0.12 145)) across nav/buttons/charts; thin green top utility bar with client name + synthetic-data disclaimer (in root layout); panel titles use modest terms ("Evidence review", "Clarification request", "Run evidence review"); success state reads "Ready for programme review" everywhere via shared status label.

## Client-fit adaptation (2026-09-17, from public funding pages)
- Terminology: "Ready for programme review" (was "Review Ready"), "programme caseworker", "applicant/partner organisation". Statuses/mismatch never framed as verdicts.
- Required design choice: **Project context panel** (purpose + target group + theme + country from published partner regions) sits directly above Required Evidence — caseworkers see the people behind the documents.
- Provenance: every issue cites its source document (REG-1…); locked reviewer note NOTE-1 rendered + enforced in AI prompt; RULE-1/2/3 cited in UI.
- Oversight language: "Evidence review complete. Human programme decision: not yet made." AI badges renamed "AI-assisted review" / "Fallback review mode".
- Simulations labelled: "Simulated upload" (the one event), "Simulated send — no message was actually sent", exact disclaimer in footer + login.
- Review activity trail: received → review run → request prepared → evidence updated → ready, persisted per browser.
- Seeds use partner countries (Peru, Vietnam, Cambodia) and foundation-plausible themes; APP-2 matches published data (REG-2 mismatch + missing plan/signoff).

## Problem
Human reviewers receive applications with supporting evidence and must quickly judge readiness: what is provided, what is missing, what is inconsistent, and what to ask the applicant. AI must assist only — never approve or reject.

## Prototype link
[<url>](https://dail-hackathon-9wekor8gv-youssef-chas-projects.vercel.app/)

## Auth + database (local SQLite — Supabase removed 2026-09-17)
- SQLite via better-sqlite3 (`lib/db.ts`, auto-seeds `./data/c07.db`, git-ignored). Password auth with scrypt hashes + HMAC-signed cookies (Edge-safe, DB-free middleware gating).
- Demo accounts seeded: reviewer@demo.local / Reviewer123!, applicant@demo.local / Applicant123! (owns APP-1 + APP-2).
- Sign-in at `/login` → reviewers to `/applications`, applicants to `/my-application`. Signed-in reviewer flow persists analyses + requests; signed-out demo runs on local seeds.
- Tables: `users`, `applications`, `evidence_items`, `analyses`, `applicant_requests`. Role checks enforced in API routes + middleware (reviewers all apps, applicants own only).

## 3-minute demo
`/applications` → open APP-1 → Run AI Analysis (CONSENT-1 missing, blocking) → Generate request (one consolidated message) → **Simulate applicant reply** (the labelled simulated event) → status flips to Analysis Required → Re-analyze → Review Ready (green, 100%). APP-2 shows the uncertain path: REG-2 mismatch plus missing plan/signoff (3 issues), clarification required, never rejected. APP-3 is the clean reference case.

## What is real
- Deterministic evidence checker (`lib/analysis.ts`): missing-item + org-name mismatch detection, status derivation, request template, source-document linking (REG-1, PLAN-1, …).
- Hybrid LLM layer (`lib/llm.ts`, `app/api/*`): DeepSeek direct drafting/interpretation with deterministic fallback; LLM `review_ready` is vetoed when deterministic checks fail. LLM sees document IDs + locked reviewer notes.
- Seeds mirror published `initial.json` (APP-1/APP-2, NOTE-1 locked spelling correction); APP-3 is an extra synthetic fixture.
- UI: Next.js 16 App Router, shadcn/base-nova CLI components, semantic tokens. Signed-in reviewers read/write SQLite; signed-out demo runs on local seeds (localStorage `c07-apps-v2`).

## What is simulated
- All seed data is synthetic and fictional (labeled `Synthetic Data` in UI).
- Evidence upload is real client-side file picking (name + readable text extracted, ≤500 KB); binary files record metadata only. **Simulate applicant reply** is the one labelled simulated event delivering mock evidence.
- Applicant request Copy is a simulated send — nothing is emailed.
- Without `DEEPSEEK_API_KEY`, analysis and drafts use the deterministic fallback (demo-safe).

## Open risks
- LLM path verified live via free interim model (`nvidia/nemotron-3-super-120b-a12b:free`, 2026-09-17): correct statuses, valid schema, polite drafts, no approve/reject language. Minor variance vs deterministic: mismatch severity `blocking` (not `warning`) and field `applicantName` (not `organisation_name`) — UI handles both. Not yet re-verified against the new published-data seeds + source IDs.
- Reviewer/applicant accounts still unprovisioned (signup + promotion pending).
- Parallel UI/landing agents are restructuring pages — coordinate before committing shared files.

## Next validation step
AI provider is **DeepSeek direct** (`DEEPSEEK_API_KEY` + `deepseek-v4-pro`, verified live on all 3 apps 2026-09-17: correct statuses, formal drafts, no approve/reject language). OpenRouter remains as a legacy fallback only. Set `DEEPSEEK_API_KEY` in the deploy environment before presenting.
