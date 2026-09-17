# c07-evidence-mcp-server

MCP server that exposes the C07 evidence-review prototype to **other LLMs**
(Claude Desktop, MCP Inspector, VS Code, …). Minimal 4-tool demo:

| Tool | What it does |
|---|---|
| `c07_list_applications` | List synthetic apps (id, applicant, completion %) |
| `c07_get_application` | Full record + evidence excerpts for one id |
| `c07_analyze_evidence` | Live `POST /api/analyze`, deterministic fallback |
| `c07_draft_applicant_request` | Live `POST /api/draft-request`, template fallback |

Rules: **AI never approves/rejects** — tools only report readiness + issues.
All seed content is fictional (`Synthetic Data`).

## Prereqs

- Node ≥ 18
- The Next.js app running for live mode: `npm run dev` (default `http://localhost:3000`)
  - Offline still works: tools fall back to the embedded deterministic checker.

## Setup

```bash
npm install --prefix mcp-server
npm run build --prefix mcp-server
```

## Run (stdio — Claude Desktop, Inspector)

```bash
node mcp-server/dist/index.js
# or: npm start --prefix mcp-server
```

Custom app URL (defaults to `http://localhost:3000`):

```bash
C07_BASE_URL=https://dail.ysfff.online node mcp-server/dist/index.js
```

## Run (Streamable HTTP)

Preferred remote option: the Next.js app itself hosts the same 4 tools at
`POST /api/mcp` (see `app/api/mcp/route.ts`), e.g.
`https://dail.ysfff.online/api/mcp`.
No separate process needed.

Standalone alternative (local demos):

```bash
PORT=3001 node mcp-server/dist/index.js --http
# health:  GET http://localhost:3001/health
# MCP:     POST http://localhost:3001/mcp
```

## Inspector test (pitch script, <3 min)

```bash
npx @modelcontextprotocol/inspector node mcp-server/dist/index.js
```

1. `c07_list_applications` → `{}` → see APP-101/102/103.
2. `c07_get_application` → `{"id":"APP-102"}` → spot the org-name mismatch.
3. `c07_analyze_evidence` → `{"id":"APP-102"}` → `needs_clarification` (live or deterministic).
4. `c07_draft_applicant_request` → `{"id":"APP-102"}` → copy-paste draft.
5. Encore: `c07_analyze_evidence` → `{"id":"APP-103"}` → `review_ready`.

## Claude Desktop config

```json
{
  "mcpServers": {
    "c07-evidence": {
      "command": "node",
      "args": ["/absolute/path/to/dail-hackathon/mcp-server/dist/index.js"],
      "env": { "C07_BASE_URL": "http://localhost:3000" }
    }
  }
}
```

## Notes

- Mirror of `lib/data.ts` + `lib/analysis.ts` is embedded so the server stays
  portable (no Next.js imports). Update both if seeds change.
- `npm run build` at repo root ignores `mcp-server/` (see root `tsconfig.json` exclude).
