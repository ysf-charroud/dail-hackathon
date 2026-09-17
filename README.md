# C07 Evidence Review — programme caseworker prototype

A thin review flow for Challenge C07: application queue → source-linked item
review → one consolidated applicant-request preview. The AI identifies missing
evidence and mismatches; it never approves or rejects. A human reviewer alone
decides (RULE-3).

Seeds mirror the published starting data (`initial.json`): APP-1
(Learning Workshop A, signoff CONSENT-1 missing) and APP-2
(Community Workshop B, registration REG-2 mismatched, plan + signoff missing).
APP-3 is an extra synthetic fixture showing the review-ready state.
Everything is fictional.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # must be clean for app/lib/components
npm run build    # must stay green — the prototype must remain pushable
```

Optional env (see `.env.example`); the app runs fully without keys:

```bash
OPENROUTER_API_KEY=        # AI drafting/interpretation (OpenRouter)
OPENROUTER_MODEL=deepseek/deepseek-v4-pro
NEXT_PUBLIC_SUPABASE_URL=  # database + auth
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Database schema + seeds: `supabase/migrations/` (applied in order).

## 3-minute demo

`/applications` → open APP-1 → Run AI Analysis (CONSENT-1 missing, blocking)
→ Generate request (one consolidated message) → **Simulate applicant reply**
(the one labelled simulated event: delivers the signoff, resets next action)
→ Re-analyze → Review Ready. APP-2 shows the uncertain path: REG-2 mismatch
plus missing plan/signoff, clarification required, never rejected.

## Real vs simulated

Real: deterministic 3-item checker (`lib/analysis.ts`), hybrid OpenRouter LLM
with deterministic veto (`lib/llm.ts`), Supabase Postgres + email-OTP auth
when configured, document viewer, editable request drafts.

Simulated (labelled in UI): **Simulate applicant reply** button, corrected
registration names, applicant-request Copy (simulated send — nothing emailed),
all seed organisations/documents/people.

## Limitations

- Binary uploads record metadata only; readable text (≤500 KB) is extracted.
- Signed-out use runs on local seeds; shared truth needs sign-in + Supabase.
- Reviewer/applicant accounts are provisioned manually (sign up, then promote).
- No real applicant contact — requests never leave the browser.

## Next validation test

With `OPENROUTER_API_KEY` set, run one live analysis per application and
confirm the LLM output stays within the structured schema (status + issues
with source document IDs). Then walk a caseworker through APP-2 and check the
single request reads as one precise, understandable ask.
