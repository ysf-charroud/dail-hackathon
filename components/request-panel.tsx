"use client";

import { useState } from "react";
import { Check, Copy, MailPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Spinner } from "./ui/spinner";

export function RequestPanel({
  hasAnalysis,
  generating,
  source,
  message,
  onGenerate,
}: {
  hasAnalysis: boolean;
  generating: boolean;
  source: "llm" | "deterministic" | null;
  message: string;
  onGenerate: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shown = draft ?? message;

  const generate = () => {
    setDraft(null);
    setCopied(false);
    onGenerate();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <MailPlus aria-hidden /> Applicant request
          </CardTitle>
          <Badge variant="default">One consolidated message</Badge>
          {source ? (
            <Badge variant="outline">
              {source === "llm" ? "AI-drafted" : "Template fallback"}
            </Badge>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
            disabled={!hasAnalysis || generating}
            onClick={generate}
          >
            {generating ? (
              <>
                <Spinner data-icon="inline-start" /> Generating
              </>
            ) : (
              "Generate request"
            )}
          </Button>
        </div>
        <CardDescription>
          {hasAnalysis
            ? "One precise request covering every issue. Edit freely. Copy is a simulated send — nothing is emailed in this prototype."
            : "Run AI analysis first. The request is built from the detected issues."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <Textarea
          aria-label="Applicant request message"
          placeholder={
            hasAnalysis
              ? "Select Generate request to draft the message."
              : "Run AI analysis first."
          }
          value={shown}
          rows={9}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled={!shown} onClick={copy}>
            {copied ? (
              <>
                <Check data-icon="inline-start" aria-hidden /> Copied
              </>
            ) : (
              <>
                <Copy data-icon="inline-start" aria-hidden /> Copy
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
