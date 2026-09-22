import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Copy,
  LockKeyhole,
  MessageSquareText,
  PlugZap,
} from "lucide-react";
import { CopyBlock } from "@/components/mcp-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MCP_ENDPOINT } from "@/lib/mcp-endpoint";

export const metadata: Metadata = {
  title: "Connect ReviewOS to your AI assistant",
  description: "A simple guide to connecting an MCP-compatible AI assistant.",
};

const CLAUDE_CONFIG = `{
  "mcpServers": {
    "reviewos": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_ENDPOINT}"]
    }
  }
}`;

const OPENCODE_CONFIG = `{
  "mcp": {
    "reviewos": {
      "type": "remote",
      "url": "${MCP_ENDPOINT}",
      "enabled": true
    }
  }
}`;

const TEST_PROMPT =
  "Use ReviewOS to list the applications, then explain what APP-2 still needs. Do not approve or reject it.";

export default function McpSetupPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-14">
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_19rem] lg:items-center">
          <div>
            <Badge variant="secondary">Setup guide</Badge>
            <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Connect ReviewOS to your AI assistant
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              MCP is a secure connection that lets an AI assistant use the
              ReviewOS evidence tools. You only need to copy one address and
              add it to your assistant. No API key is required for this demo.
            </p>
          </div>
          <div className="rounded-xl bg-primary p-5 text-primary-foreground">
            <PlugZap className="size-6" aria-hidden />
            <p className="mt-4 text-sm font-semibold">Your connection address</p>
            <p className="mt-1 break-all text-sm leading-relaxed opacity-85">
              {MCP_ENDPOINT}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="setup-heading" className="mt-10">
        <h2 id="setup-heading" className="text-xl font-bold">
          Set it up in three steps
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <span className="text-sm font-semibold text-primary">Step 1</span>
              <CardTitle className="text-base">Copy the address</CardTitle>
            </CardHeader>
            <CardContent>
              <CopyBlock label="ReviewOS MCP endpoint" text={MCP_ENDPOINT} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <span className="text-sm font-semibold text-primary">Step 2</span>
              <CardTitle className="text-base">Add it to your assistant</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              Open your assistant&apos;s MCP or Connections settings, add a remote
              server, name it <strong className="text-foreground">ReviewOS</strong>,
              and paste the address. If it asks for a transport, choose
              <strong className="text-foreground"> Streamable HTTP</strong>.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <span className="text-sm font-semibold text-primary">Step 3</span>
              <CardTitle className="text-base">Restart and test</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              Restart your assistant. Look for four ReviewOS tools, then send
              the test prompt below. Your assistant should find APP-2 and
              explain its missing evidence.
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="config-heading" className="mt-10">
        <div className="flex items-center gap-3">
          <Copy className="size-5 text-primary" aria-hidden />
          <div>
            <h2 id="config-heading" className="text-xl font-bold">
              Ready-made settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use these only if your assistant asks you to edit a settings file.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Claude Desktop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Open Claude&apos;s developer settings, choose Edit Config, paste
                this inside the file, save it, then fully restart Claude.
              </p>
              <CopyBlock label="Claude configuration" text={CLAUDE_CONFIG} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">OpenCode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Add this block to your OpenCode configuration, save the file,
                then restart OpenCode.
              </p>
              <CopyBlock label="OpenCode configuration" text={OPENCODE_CONFIG} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        aria-labelledby="test-heading"
        className="mt-10 grid gap-4 lg:grid-cols-[1fr_18rem]"
      >
        <Card>
          <CardHeader>
            <CardTitle
              id="test-heading"
              className="flex items-center gap-2 text-base"
            >
              <MessageSquareText className="size-4" aria-hidden /> Test the connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CopyBlock label="Message to send" text={TEST_PROMPT} />
          </CardContent>
        </Card>
        <Alert>
          <LockKeyhole aria-hidden />
          <AlertTitle>Human review stays in control</AlertTitle>
          <AlertDescription>
            The tools can inspect sample evidence and draft a message. They
            cannot approve, reject, edit, or send anything.
          </AlertDescription>
        </Alert>
      </section>

      <section
        aria-labelledby="help-heading"
        className="mt-10 rounded-xl border bg-muted/30 p-5 sm:p-6"
      >
        <h2 id="help-heading" className="flex items-center gap-2 font-bold">
          <CircleHelp className="size-5" aria-hidden /> If it does not connect
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            Check that the copied address ends with{" "}
            <strong className="text-foreground">/api/mcp</strong>.
          </li>
          <li>Fully close and reopen your assistant after changing its settings.</li>
          <li>If you edited JSON, check that every bracket and comma is still present.</li>
          <li>
            Opening the address in a normal browser may show an error. That is
            expected because an MCP client must make the connection.
          </li>
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/applications" className={buttonVariants()}>
          View sample applications
          <ArrowRight data-icon="inline-end" aria-hidden />
        </Link>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-green-600" aria-hidden />
          Four read-only tools, using synthetic data
        </span>
      </div>
    </main>
  );
}
