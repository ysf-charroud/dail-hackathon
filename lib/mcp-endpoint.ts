const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const MCP_ENDPOINT = `${APP_URL}/api/mcp`;
