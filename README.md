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
DEEPSEEK_API_KEY=          # AI drafting/interpretation (DeepSeek direct)
# DEEPSEEK_MODEL=deepseek-v4-pro
# SQLITE_FILE=./data/c07.db   # optional override, git-ignored
# SESSION_SECRET=change-me     # signs auth cookies (dev default is insecure)
```

Local SQLite database + password auth — no external services needed:

```bash
# demo accounts (seeded automatically on first run)
reviewer@demo.local / Reviewer123!    # sees all applications
applicant@demo.local / Applicant123!  # owns APP-1 + APP-2
```

Schema + seeds live in `lib/db.ts` (auto-created at `./data/c07.db`).

## 3-minute demo

`/applications` → open APP-1 → Run AI Analysis (CONSENT-1 missing, blocking)
→ Generate request (one consolidated message) → **Simulate applicant reply**
(the one labelled simulated event: delivers the signoff, resets next action)
→ Re-analyze → Review Ready. APP-2 shows the uncertain path: REG-2 mismatch
plus missing plan/signoff, clarification required, never rejected.

## Real vs simulated

Real: deterministic 3-item checker (`lib/analysis.ts`), hybrid DeepSeek LLM
with deterministic veto (`lib/llm.ts`), local SQLite + password auth with
demo accounts, document viewer, editable request drafts.

Simulated (labelled in UI): **Simulate applicant reply** button, corrected
registration names, applicant-request Copy (simulated send — nothing emailed),
all seed organisations/documents/people.

## Limitations

- Binary uploads record metadata only; readable text (≤500 KB) is extracted.
- Preview deployments without a writable disk fall back to local demo data.
- New accounts start as applicants; promote reviewers by updating the DB
  (`users.role`) directly.
- No real applicant contact — requests never leave the browser.

## Connect an AI assistant with MCP

The hosted MCP connection is:

```text
https://dail.ysfff.online/api/mcp
```

In an MCP-compatible assistant, add a remote server named `ReviewOS`, paste
that address, and select Streamable HTTP if a transport is requested. Restart
the assistant, then ask: `Use ReviewOS to list the applications.`

The in-app guide at `/mcp` includes copy-ready settings for Claude Desktop and
OpenCode. The MCP tools use synthetic data and cannot approve, reject, edit, or
send anything.

## Next validation test

With `DEEPSEEK_API_KEY` set, run one live analysis per application and
confirm the LLM output stays within the structured schema (status + issues
with source document IDs). Then walk a caseworker through APP-2 and check the
single request reads as one precise, understandable ask.
