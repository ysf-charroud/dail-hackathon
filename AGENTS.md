<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# C07 evidence-review prototype (hackathon)

DaiL Octopus day hackathon project (Challenge C07). The deliverable is a **working prototype link demoable in under 3 minutes**: list → open flagged app → run AI analysis → generate applicant request → simulate fix → re-analyze → Review Ready. Harness context: https://dail-octopus-review.vercel.app/onboarding-assets/harness-onboarding.pdf

- Keep `npm run build` green at all times — the prototype must stay pushable/previewable. No test suite exists; verify with `npm run lint` + `npm run build`.
- Work in small focused changes; save room for final demo fixes.
- Never paste secrets into chat or commit them. AI keys are optional (see below).

## Stack

Next.js 16.3.5 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · shadcn/ui (base-nova = **Base UI, not Radix**) · lucide-react · Supabase Postgres + email-password auth (optional; local-seed fallback).

## Commands

- `npm run dev` / `npm run build` / `npm run start` / `npm run lint`
- If `next dev` refuses with "already running", a server is already up in this dir (default :3000) — reuse it, don't spawn another.
- shadcn: `npx shadcn@latest add <name>`, `npx shadcn@latest docs <name>` (fetch the URLs before using a component). Check `components/ui/` first; never `--overwrite` without approval.

## Layout

- `app/page.tsx` — dashboard list (client, reads store).
- `app/applications/[id]/page.tsx` — detail view (client, `useParams`, not async `params`).
- `app/api/analyze/route.ts`, `app/api/draft-request/route.ts` — POST handlers, `Response.json`, `export const dynamic = "force-dynamic"`.
- `lib/` — `types.ts` (statuses, evidence model, doc IDs), `data.ts` (seeds mirroring published `initial.json`: APP-1/APP-2 + extra APP-3 fixture), `analysis.ts` (deterministic checker), `llm.ts` (OpenRouter), `store.tsx` (Supabase-backed when signed in, else localStorage `c07-apps-v2`), `supabase/` clients.
- `supabase/migrations/` — schema + seeds, applied via Supabase MCP (`python3 /tmp/opencode/mcp.py call apply_migration …`); verify with `execute_sql`.
- `components/ui/*` is CLI-owned. Feature components: `status-badge`, `evidence-checklist`, `analysis-panel`, `request-panel`, `app-header`.

## Rules that matter here

- **AI never approves/rejects.** `review_ready` = evidence complete + consistent only. Deterministic analysis vetoes an LLM `review_ready` when checks fail (`lib/llm.ts`).
- Statuses (exact): `analysis_required`, `missing_evidence`, `needs_clarification`, `review_ready`. Completion = provided/3 (33/67/100%); mismatches don't lower it.
- App works with **no API key** (deterministic fallback). Env contract is `.env.example` (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`); never hard-code providers or secrets.
- UI: semantic theme tokens (`bg-card`, `text-muted-foreground`), never raw slate palettes — except red/amber/green **status** surfaces (preset has no tokens for those). Button icons need `data-icon="inline-start|end"`; pending buttons use `Spinner`; dialogs require `DialogTitle`; callouts use `Alert`.
- Label synthetic data in UI (`Synthetic Data` badge); all seed content must stay fictional.
- Root layout typing `LayoutProps<"/">` is Next 16 typed-routes API — leave it alone.
