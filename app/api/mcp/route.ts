import { createMcpHandler } from "mcp-handler";
import { C07_SERVER_NAME, C07_SERVER_VERSION, registerC07Tools } from "@/lib/mcp";

export const dynamic = "force-dynamic";
// Draft tool can chain two LLM calls (20s timeout each) — 60s covers the
// worst case. Within Vercel Hobby's 60s function limit; Pro allows more.
export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => {
    registerC07Tools(server);
  },
  {
    serverInfo: { name: C07_SERVER_NAME, version: C07_SERVER_VERSION },
  },
);

export { handler as GET, handler as POST };
