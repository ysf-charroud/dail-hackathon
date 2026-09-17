# C07 Hackathon Prototype — Clarification Questions

> Gate response to the Build Brief: **No — not everything is clear enough to start building.**
> Ambiguities and product/technical decisions below must be resolved before implementation.
> No code, scaffolding, or file changes have been made (beyond this file).

## 0. Repo reality-check (observed, no changes made)

- Repo is a bare `create-next-app`: Next `16.3.5`, React 19, Tailwind v4, TypeScript. No `shadcn/ui`, no `lucide-react`, no AI SDK installed.
- `AGENTS.md` requires reading `node_modules/next/dist/docs/` before writing code (Next version here may differ from training data).
- No synthetic data file, API routes, or app pages beyond default `app/page.tsx` exist yet.

---

## 1. AI implementation (biggest risk)

**Q1. Real LLM or deterministic simulated AI engine?**
The brief says "AI integration behind a server-side API route" with structured JSON output, but names no provider, model, or API key.
Options:
- (a) Deterministic server-side analyzer returning the exact JSON shape from the brief (recommended: zero key, offline-safe, 100% demo-reliable)
- (b) Real LLM call from `/api/analyze` with structured output
- (c) Hybrid: deterministic default + optional live-LLM toggle if key present

**Q2. If real LLM: which provider/model/key?**
Who supplies the key, and must the demo work offline / without internet? Is there a fallback if the LLM call fails mid-demo?

**Q3. Is the request message template or LLM-drafted?**
Template derived from issues (reliable) vs. live LLM drafting? Editable textarea + copy button, or read-only?

## 2. Data & evidence model

**Q4. What is "evidence" — full document text or just metadata?**
For mismatch detection I need exact comparable fields. Is each evidence item just `{ type, status, organisationName, date }`, or is there mock document body text + a fake viewer?

**Q5. Seed data: exactly 2 apps or 3?**
Brief requires Learning Workshop A (missing signoff) + Community Workshop B (name mismatch). Should I add a 3rd already-Review-Ready app so the list view shows all states, or strictly 2?

**Q6. Persistence for evidence updates?**
In-memory React state only, `localStorage`, or JSON file write-back? "Update evidence → re-analyze" can be a simulated toggle (`Mark as provided` / edit org name) vs. mock file-upload dialog. Which is acceptable?

## 3. Status, scoring & rules

**Q7. Canonical status taxonomy?**
Brief lists `Review Ready / Missing Evidence / Needs Clarification / Analysis Required`, but examples also use `Not review-ready`, `needs_attention`, `needs_clarification`. Confirm the exact enum + mapping from AI JSON `status` to UI badge.

**Q8. Completion % formula?**
Is it simply `complete checklist items / 3` (33/66/100%)? Any weighting?

**Q9. Fixed 3-item checklist only?**
Registration record, activity plan, responsible-person signoff — no additional evidence types or eligibility rules to be invented, correct?

## 4. UI / UX & demo flow

**Q10. shadcn/ui + Lucide: full install or lightweight?**
Neither is installed. May I add `lucide-react` (+ minimal `clsx`/`tailwind-merge` + shadcn-style components), or must I avoid new deps and hand-build Tailwind components?

**Q11. Routing: single-page master-detail or separate routes?**
E.g. `/` list + `/applications/[id]` detail, with state in URL — acceptable? Any required branding / "Synthetic data" banner placement?

**Q12. Re-analysis trigger?**
Manual "Run analysis" button only, automatic on evidence change, or both? Should prior analysis results remain visible (history) or be replaced?

**Q13. English only? Any accessibility/theming requirement (dark mode)?**

## 5. Scope & judging

**Q14. What matters most to C07 judges?**
Rank: visual polish, AI reasoning transparency, explanation quality, demo smoothness? Any scoring rubric I should optimize for?

**Q15. Deployment target?**
`npm run dev` localhost demo only, or must `npm run build` + hosted deployment work?

---

## Confirmation needed

Please answer Q1–Q15 (or at minimum Q1, Q5, Q6, Q7, Q10). Once resolved, confirm explicitly with **"start building"** and I will produce the implementation plan + build.
