import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FileText,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Programme evidence review · Schmitz-Stiftungen",
  description:
    "A human-led evidence review prototype for Schmitz-Stiftungen programme applications.",
};

const STEPS = [
  {
    icon: FileText,
    title: "Check the file",
    body: "See which required documents are present and where evidence is incomplete.",
  },
  {
    icon: CircleAlert,
    title: "Clarify inconsistencies",
    body: "Turn mismatched information into a specific question for the applicant.",
  },
  {
    icon: FileCheck2,
    title: "Prepare human review",
    body: "Move complete and consistent files forward without automating the decision.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 pb-10">
      <section className="grid items-center gap-10 border-b pb-16 pt-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:pb-20 lg:pt-8">
        <div className="max-w-xl">
          <Badge variant="outline">Synthetic prototype</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Clear evidence for responsible programme decisions.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Review applications consistently, request exactly what is missing,
            and prepare complete files for a caseworker. The final decision
            always remains with people.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/applications" className={cn(buttonVariants({ size: "lg" }))}>
              Open application queue <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
            <Link href="#process" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              See the review process
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden /> AI assists with evidence checks. It never approves or rejects.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 bg-primary/5" aria-hidden />
          <div className="overflow-hidden border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <FileText aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold">Learning Workshop A</p>
                <p className="text-xs text-muted-foreground">APP-1 · Vocational pilot</p>
              </div>
              <Badge variant="secondary" className="ml-auto">Analysis required</Badge>
            </div>

            <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
              <div className="border-b p-5 md:border-r md:border-b-0">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold">Evidence</p>
                    <p className="mt-1 text-xs text-muted-foreground">2 of 3 documents provided</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">67%</span>
                </div>
                <Progress value={67} className="mt-3" />
                <ul className="mt-5 flex flex-col gap-4 text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 text-primary" aria-hidden />
                    <span><span className="block font-medium">Registration record</span><span className="text-xs text-muted-foreground">Provided and verified</span></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 text-primary" aria-hidden />
                    <span><span className="block font-medium">Activity plan</span><span className="text-xs text-muted-foreground">Provided and verified</span></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CircleAlert className="mt-0.5 text-destructive" aria-hidden />
                    <span><span className="block font-medium">Responsible-person signoff</span><span className="text-xs text-muted-foreground">Still required</span></span>
                  </li>
                </ul>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Evidence review</p>
                  <Badge variant="outline">Human controlled</Badge>
                </div>
                <div className="mt-4 border-l-2 border-primary bg-muted/60 p-4">
                  <p className="text-sm font-medium">One action needed</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    The responsible-person signoff is missing. Request the signed document before programme review.
                  </p>
                </div>
                <div className="mt-4 flex items-start gap-3 border p-4">
                  <MessageSquareText className="mt-0.5 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">Applicant request ready to draft</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">A precise, editable request based only on the evidence issue.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="scroll-mt-32">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">A clear path from application to review</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The workflow supports careful casework and reflects the foundation&apos;s focus on reliable, sustainable action.
          </p>
        </div>
        <div className="mt-8 grid border-y md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article key={step.title} className="border-b py-7 last:border-b-0 md:border-r md:border-b-0 md:px-7 md:first:pl-0 md:last:border-r-0">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary"><step.icon aria-hidden /></span>
                <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 bg-muted/60 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">Ready for a three-minute review?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Open a flagged file, run the evidence check, draft a request, simulate the fix, and return the file to human review.
          </p>
        </div>
        <Link href="/applications" className={cn(buttonVariants({ size: "lg" }))}>
          Start the demo <ArrowRight data-icon="inline-end" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
