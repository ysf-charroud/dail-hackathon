import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not shipped to Vercel: local agent skills + standalone MCP server build.
    ".opencode/**",
    ".agents/**",
    "agent/**",
    "mcp-server/dist/**",
    "mcp-server/node_modules/**",
  ]),
]);

export default eslintConfig;
