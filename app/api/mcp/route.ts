import { createMcpHandler } from "mcp-handler";
import { C07_SERVER_NAME, C07_SERVER_VERSION, registerC07Tools } from "@/lib/mcp";

export const dynamic = "force-dynamic";
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
