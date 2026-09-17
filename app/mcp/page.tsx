import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Globe,
  MonitorDown,
  ShieldCheck,
} from "lucide-react";
import { CopyBlock } from "@/components/mcp-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "MCP setup — use other LLMs with ReviewOS",
  description:
    "Connect Claude Desktop or any MCP client to ReviewOS.",
};

const TOOLS = [
  {
    name: "c07_list_applications",
    body: "List applications with completion %. Start here to get valid APP-xxx ids.",
  },
  {
    name: "c07_get_application",
    body: "Full record + evidence excerpts for one id, e.g. APP-102.",
  },
  {
    name: "c07_analyze_evidence",
    body: "Live POST /api/analyze with deterministic fallback. Returns status + issues.",
  },
  {
    name: "c07_draft_applicant_request",
    body: "Live POST /api/draft-request with template fallback. Drafts text, sends nothing.",
  },
];

const DEPLOYED_URL =
  "https://dail.ysfff.online";

const CLAUDE_JSON = `{
  "mcpServers": {
    "c07-evidence": {
      "command": "node",
      "args": ["/absolute/path/to/dail-hackathon/mcp-server/dist/index.js"],
      "env": { "C07_BASE_URL": "${DEPLOYED_URL}" }
    }
  }
}`;

const EXAMPLE_SESSION = `1. c07_list_applications → {} → see APP-101 / 102 / 103
2. c07_get_application → {"id": "APP-102"} → spot the org-name mismatch
3. c07_analyze_evidence → {"id": "APP-102"} → needs_clarification
4. c07_draft_applicant_request → {"id": "APP-102"} → copy the draft
5. Finally: c07_analyze_evidence → {"id": "APP-103"} → review_ready`;

export default function McpSetupPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-5 py-10">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">MCP server</Badge>
      </div>
      <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        Use other LLMs with ReviewOS
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        The <span className="font-mono text-sm">c07-evidence-mcp-server</span>{" "}
        exposes the evidence-review prototype to any MCP client — Claude
        Desktop, VS Code, or any MCP client — as 4 read-only tools. It calls the
        live Next.js API first and falls back to the deterministic checker when
        the app is offline, so the demo never breaks.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Live deployment:{" "}
        <Link
          href={DEPLOYED_URL}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs break-all text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
        >
          {DEPLOYED_URL}
        </Link>{" "}
        — point{" "}
        <span className="font-mono text-xs">C07_BASE_URL</span> at it and no
        local server is needed. Note: this preview URL is behind Vercel login,
        so remote clients get the deterministic fallback (same verdicts,
        source shown as deterministic) — run the app locally for live-LLM
        mode.
      </p>

      {/* ── Tools ─────────────────────────────────────────── */}
      <section aria-label="Available tools" className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Blocks className="size-5" aria-hidden /> 4 tools, one workflow
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TOOLS.map((t, i) => (
            <Card key={t.name}>
              <CardContent className="flex items-start gap-3 pt-5">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block font-mono text-sm font-bold">
                    {t.name}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                    {t.body}
                  </span>
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Setup options ─────────────────────────────────── */}
      <section aria-label="Setup options" className="mt-10">
        <h2 className="text-lg font-bold">Connect in under 5 minutes</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MonitorDown className="size-4" aria-hidden /> Claude Desktop
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-[13px] leading-snug text-muted-foreground">
                Add to{" "}
                <span className="font-mono text-xs">
                  claude_desktop_config.json
                </span>
                , replacing the path with your checkout. It points at the live
                deployment, so no local server is needed — swap in{" "}
                <span className="font-mono text-xs">
                  http://localhost:3000
                </span>{" "}
                to use your own dev server instead.
              </p>
              <CopyBlock label="claude_desktop_config.json" text={CLAUDE_JSON} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4" aria-hidden /> Remote HTTP
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-[13px] leading-snug text-muted-foreground">
                Streamable HTTP endpoint for web clients and shared demos —
                paste the URL straight into your MCP client:
              </p>
              <CopyBlock label="MCP server URL" text={`${DEPLOYED_URL}/api/mcp`} />
              <CopyBlock
                label="client config (remote)"
                text={`{\n  "c07-evidence-remote": {\n    "url": "${DEPLOYED_URL}/api/mcp"\n  }\n}`}
              />
              <p className="text-[13px] leading-snug text-muted-foreground">
                Running the app yourself? Use{" "}
                <span className="font-mono text-xs">
                  http://localhost:3000/api/mcp
                </span>{" "}
                instead.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Example session ─────────────────────────────── */}
      <section aria-label="Example session" className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4" aria-hidden /> Example
              walkthrough
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CopyBlock label="example tool calls" text={EXAMPLE_SESSION} />
          </CardContent>
        </Card>
        <Alert className="mt-4">
          <ShieldCheck aria-hidden />
          <AlertTitle>Human oversight, by design</AlertTitle>
          <AlertDescription>
            These tools only report readiness and issues — they never approve
            or reject. All content is sample data.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/applications" className={buttonVariants()}>
            Get started
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Link>
          <Link
            href="/applications/APP-102"
            className={buttonVariants({ variant: "outline" })}
          >
            See an example
          </Link>
        </div>
      </section>
    </div>
  );
}
