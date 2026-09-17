import type { NextRequest } from "next/server";
import type { ApplicationRecord } from "@/lib/types";
import { analyzeWithLlm } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let app: ApplicationRecord;
  try {
    const body = (await request.json()) as { application?: ApplicationRecord };
    if (!body.application) {
      return Response.json({ error: "Missing application" }, { status: 400 });
    }
    app = body.application;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { analysis, source } = await analyzeWithLlm(app);
  return Response.json({
    ...analysis,
    source,
    analyzedAt: new Date().toISOString(),
  });
}
