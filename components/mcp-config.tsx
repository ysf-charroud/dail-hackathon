"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";

export function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
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
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
