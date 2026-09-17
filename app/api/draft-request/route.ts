import type { NextRequest } from "next/server";
import type { AnalysisResult, ApplicationRecord } from "@/lib/types";
import { buildRequestTemplate } from "@/lib/analysis";
import { draftRequestWithLlm } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      application?: ApplicationRecord;
      analysis?: AnalysisResult;
    };
    if (!body.application || !body.analysis) {
      return Response.json(
        { error: "Missing application or analysis" },
        { status: 400 },
      );
    }
    const template = buildRequestTemplate(body.application, body.analysis);
    const { message, source } = await draftRequestWithLlm(
      body.application,
      body.analysis,
      template,
    );
    return Response.json({ message, source });
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
