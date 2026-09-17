import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileText,
  Files,
  Inbox,
  Info,
  ListChecks,
  Play,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import SplitText from "@/components/SplitText";
import FadeContent from "@/components/FadeContent";
import SpotlightCard from "@/components/SpotlightCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { REQUIRED_EVIDENCE } from "@/lib/types";

export const metadata: Metadata = {
  title: "ReviewOS — Review applications faster. Decide with confidence.",
  description:
    "ReviewOS uses AI to identify missing evidence, mismatches, and next steps so your team can make faster, fairer decisions — with humans in control.",
};

const FEATURES = [
  {
    icon: Zap,
    title: "Finds what's missing",
    body: "AI flags gaps across the three required evidence items and suggests next steps.",
  },
  {
    icon: ShieldCheck,
    title: "Checks for mismatches",
    body: "Highlights inconsistencies across documents — e.g. organisation names that don't line up.",
  },
  {
    icon: Send,
    title: "Drafts the applicant request",
    body: "Generates a polite, specific message asking for exactly what's outstanding.",
  },
];

const STEPS = [
  {
    title: "Open a flagged application",
    body: "Start from the application queue — APP-101 or APP-102.",
  },
  {
    title: "Inspect the evidence checklist",
    body: "Three required items: registration record, activity plan, responsible-person signoff.",
  },
  {
    title: "Run AI analysis",
    body: "Deterministic checks run first; an LLM summary is layered on when a key is configured.",
  },
  {
    title: "Generate the applicant request",
    body: "One click drafts the message for the missing or inconsistent evidence.",
  },
  {
    title: "Simulate the fix, then re-analyze",
    body: "Provide the missing item and re-run analysis to reach Review Ready.",
  },
];

const DEMO_APPS = [
  {
    id: "APP-101",
    name: "Learning Workshop A",
    programme: "Vocational pilot",
    status: "missing_evidence" as const,
    completion: "67%",
    note: "Signoff missing",
  },
  {
    id: "APP-102",
    name: "Community Workshop B",
    programme: "Trainer development",
    status: "needs_clarification" as const,
    completion: "100%",
    note: "Org-name mismatch",
  },
  {
    id: "APP-103",
    name: "Northgate Skills Collective",
    programme: "Vocational pilot",
    status: "review_ready" as const,
    completion: "100%",
    note: "Complete + consistent",
  },
];

function ProductMock() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-blue-900/10"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="mx-auto hidden rounded-md bg-background px-3 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">
          reviewos · APP-101
        </span>
        <span className="w-10" />
      </div>

      <div className="flex text-left">
        {/* Sidebar */}
        <div className="hidden w-40 shrink-0 flex-col gap-1 bg-primary p-3 text-primary-foreground md:flex">
          <p className="flex items-center gap-1.5 px-1.5 py-1 text-xs font-bold">
            <ShieldCheck className="size-3.5" /> ReviewOS
          </p>
          {[
            { icon: Search, label: "Search" },
            { icon: Files, label: "Applications" },
            { icon: Inbox, label: "My queue" },
            { icon: Users, label: "Team" },
            { icon: Settings, label: "Settings" },
          ].map((n) => (
            <span
              key={n.label}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[11px] text-primary-foreground/70 first:bg-white/10 first:text-primary-foreground"
            >
              <n.icon className="size-3.5" /> {n.label}
            </span>
          ))}
          <span className="mt-auto px-1.5 pt-3 text-[10px] leading-snug text-primary-foreground/50">
            Smarter review
            <br />
            Stronger communities
          </span>
        </div>

        {/* Main panel */}
        <div className="min-w-0 flex-1 bg-muted/40 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              ← Applications / APP-101
            </span>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              <span className="size-3 rounded-full bg-blue-600 text-[8px] text-white" />
              Jamie Davis · Reviewer
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">Learning Workshop A</p>
            <span className="rounded bg-blue-600/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              Vocational pilot
            </span>
            <span className="ml-auto rounded-md bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              ● In review
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            APP-101 · Submitted 2026-09-02 · Priority: Standard
          </p>

          <div className="mt-2 flex gap-3 border-b text-[10px] font-medium">
            <span className="border-b-2 border-primary pb-1">Overview</span>
            <span className="pb-1 text-muted-foreground">Evidence</span>
            <span className="hidden pb-1 text-muted-foreground sm:inline">
              AI analysis
            </span>
            <span className="hidden pb-1 text-muted-foreground sm:inline">
              Activity
            </span>
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_1.2fr_1fr]">
            {/* Evidence checklist */}
            <div className="rounded-lg border bg-card p-2.5">
              <p className="text-[11px] font-bold">Evidence checklist</p>
              <p className="text-[10px] text-muted-foreground">
                2 of 3 complete
              </p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 rounded-full bg-emerald-500" />
              </div>
              <ul className="mt-2 flex flex-col gap-1.5 text-[10px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                  <span>
                    <span className="block font-semibold">
                      Registration record
                    </span>
                    <span className="block text-muted-foreground">
                      Verified
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                  <span>
                    <span className="block font-semibold">Activity plan</span>
                    <span className="block text-muted-foreground">
                      Verified
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CircleAlert className="size-3.5 shrink-0 text-amber-500" />
                  <span>
                    <span className="block font-semibold">
                      Responsible-person signoff
                    </span>
                    <span className="block text-muted-foreground">Missing</span>
                  </span>
                </li>
              </ul>
            </div>

            {/* AI analysis */}
            <div className="rounded-lg border bg-card p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold">
                AI analysis
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-700">
                  ● High confidence
                </span>
              </p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-md bg-emerald-500/10 p-1.5">
                  <p className="text-sm font-bold text-emerald-700">2</p>
                  <p className="text-[9px] text-muted-foreground">
                    Items verified
                  </p>
                </div>
                <div className="rounded-md bg-amber-500/10 p-1.5">
                  <p className="text-sm font-bold text-amber-700">1</p>
                  <p className="text-[9px] text-muted-foreground">
                    Issue detected
                  </p>
                </div>
                <div className="rounded-md bg-blue-600/10 p-1.5">
                  <p className="text-sm font-bold text-blue-700">1</p>
                  <p className="text-[9px] text-muted-foreground">
                    Needs review
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] font-bold">Summary</p>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Registration and activity plan check out. The responsible-person
                signoff is missing — request it before proceeding.
              </p>
            </div>

            {/* Request + decision */}
            <div className="hidden flex-col gap-2 lg:flex">
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-[11px] font-bold">Request message</p>
                <p className="mt-1 rounded-md bg-muted p-1.5 text-[9px] leading-snug text-muted-foreground">
                  Hi — thanks for your application. We&apos;re just missing
                  your responsible-person signoff. Please upload it when you
                  can…
                </p>
                <span className="mt-1.5 block rounded-md bg-primary py-1 text-center text-[10px] font-semibold text-primary-foreground">
                  ✈ Send request
                </span>
              </div>
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-[11px] font-bold">Your decision</p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  ○ Approve · ◉ Request more information · ○ Decline
                </p>
                <span className="mt-1.5 block rounded-md bg-primary py-1 text-center text-[10px] font-semibold text-primary-foreground">
                  Confirm decision
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingCallout({
  className,
  icon: Icon,
  title,
  body,
}: {
  className?: string;
  icon: typeof Zap;
  title: string;
  body: string;
}) {
  return (
    <div
      className={`max-w-55 items-start gap-2.5 rounded-xl border bg-card/95 p-3.5 shadow-xl shadow-blue-900/10 backdrop-blur ${className ?? ""}`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700">
        <Icon className="size-4" aria-hidden />
      </span>
      <span>
        <span className="block text-[13px] font-bold">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {body}
        </span>
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -top-24 right-[-10%] h-105 w-130 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute top-40 left-[-12%] h-80 w-105 rounded-full bg-blue-400/10 blur-3xl" />
        </div>
        <p
          aria-hidden="true"
          className="absolute top-24 left-5 hidden text-[10px] leading-loose font-semibold tracking-[0.2em] text-muted-foreground/70 xl:block"
        >
          PEOPLE
          <br />
          EVIDENCE
          <br />
          BETTER DECISIONS
        </p>
        <p
          aria-hidden="true"
          className="absolute top-16 right-5 hidden text-right text-[10px] leading-loose font-semibold tracking-[0.2em] text-muted-foreground/70 xl:block"
        >
          HIGHER
          <br />
          STANDARDS
          <br />
          FASTER OUTCOMES
        </p>

        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-12 pb-8 text-center sm:pt-16">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary">AI-assisted evidence review</Badge>
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            <SplitText
              text="Review applications faster."
              tag="span"
              splitType="chars"
              delay={18}
              duration={0.7}
            />
            <SplitText
              text="Decide with confidence."
              tag="span"
              splitType="chars"
              delay={18}
              duration={0.7}
              className="block text-blue-700 dark:text-blue-400"
            />
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            ReviewOS uses AI to identify missing evidence, mismatches, and next
            steps so your team can make faster, fairer decisions — with humans
            in control.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/applications"
              className={buttonVariants({ size: "lg" })}
            >
              Get started
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
            <Link
              href="#how-it-works"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              <Play data-icon="inline-start" aria-hidden /> See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No sign-up required · Guided tour included
          </p>
        </div>

        {/* Product visual with floating callouts */}
        <div className="relative mx-auto max-w-5xl px-5 pb-4">
          <div className="relative lg:mx-16">
            <ProductMock />
            <FloatingCallout
              className="absolute top-16 -left-16 hidden xl:flex"
              icon={Zap}
              title="Finds what's missing"
              body="AI flags gaps and suggests next steps."
            />
            <FloatingCallout
              className="absolute bottom-24 -left-12 hidden xl:flex"
              icon={ShieldCheck}
              title="Checks for mismatches"
              body="Highlights inconsistencies across documents."
            />
            <FloatingCallout
              className="absolute bottom-16 -right-14 hidden xl:flex"
              icon={Users}
              title="You stay in control"
              body="AI provides insights. You make the call."
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:hidden">
            <FloatingCallout
              className="flex"
              icon={Zap}
              title="Finds what's missing"
              body="AI flags gaps and suggests next steps."
            />
            <FloatingCallout
              className="flex"
              icon={ShieldCheck}
              title="Checks for mismatches"
              body="Highlights inconsistencies across documents."
            />
            <FloatingCallout
              className="flex"
              icon={Users}
              title="You stay in control"
              body="AI provides insights. You make the call."
            />
          </div>
          <p
            aria-hidden="true"
            className="mt-6 hidden text-right text-[10px] leading-loose font-semibold tracking-[0.2em] text-muted-foreground/70 xl:block"
          >
            FAIRER REVIEWS
            <br />
            BRIGHTER OPPORTUNITIES
          </p>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────── */}
      <section aria-label="Product facts" className="mx-auto w-full max-w-5xl px-5 py-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Files,
              title: "3 evidence items",
              body: "Registration, activity plan, signoff — completion is provided / 3.",
            },
            {
              icon: ShieldCheck,
              title: "AI assists, humans decide",
              body: "Review Ready means complete + consistent. Never an approval.",
            },
            {
              icon: Zap,
              title: "Deterministic safety net",
              body: "Rule-based checks veto an LLM verdict when evidence fails.",
            },
          ].map((t) => (
            <Card key={t.title}>
              <CardContent className="flex items-start gap-3 pt-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400">
                  <t.icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-bold">{t.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                    {t.body}
                  </span>
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="mx-auto w-full max-w-5xl scroll-mt-20 px-5 py-10">
        <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-400">
          What it does
        </p>
        <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          Everything a reviewer needs, nothing they don&apos;t
        </h2>
        <FadeContent blur duration={700} threshold={0.15}>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <SpotlightCard
                key={f.title}
                className="transition-shadow hover:shadow-lg"
              >
                <div className="relative flex flex-col gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <p className="text-base font-bold">{f.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </FadeContent>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-5xl scroll-mt-20 px-5 py-10"
      >
        <FadeContent blur duration={700} threshold={0.15}>
          <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-400">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                From flagged to Review Ready
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Follow the exact path a reviewer takes: open a flagged
                application, run analysis, draft the applicant message, simulate
                the fix, and re-analyze.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/applications"
                  className={buttonVariants()}
                >
                  Get started
                  <ArrowRight data-icon="inline-end" aria-hidden />
                </Link>
                <Link
                  href="/applications/APP-101"
                  className={buttonVariants({ variant: "outline" })}
                >
                  View an example
                </Link>
              </div>
            </div>
            <ol className="flex flex-col gap-3">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className="flex items-start gap-3 rounded-xl border bg-background p-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{s.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                      {s.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          </div>
        </FadeContent>
      </section>

      {/* ── Evidence model ───────────────────────────────── */}
      <section
        id="evidence-model"
        className="mx-auto w-full max-w-5xl scroll-mt-20 px-5 py-10"
      >
        <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-400">
          Evidence model
        </p>
        <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          Three documents. Four statuses. Zero ambiguity.
        </h2>
        <FadeContent blur duration={700} threshold={0.15}>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <p className="flex items-center gap-2 text-sm font-bold">
                <ListChecks className="size-4" aria-hidden /> Required evidence
              </p>
              <ul className="flex flex-col gap-2">
                {REQUIRED_EVIDENCE.map((r) => (
                  <li
                    key={r.kind}
                    className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-sm"
                  >
                    <FileText
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="font-medium">{r.label}</span>
                    <Badge variant="secondary" className="ml-auto">
                      required
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Completion is simply provided / 3 — 33%, 67% or 100%.
                Mismatches never lower completion; they block readiness
                instead.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Info className="size-4" aria-hidden /> Review statuses
              </p>
              <ul className="flex flex-col gap-2.5">
                <li className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status="analysis_required" />
                  <span className="text-[13px] text-muted-foreground">
                    Not yet analyzed — or evidence changed since analysis.
                  </span>
                </li>
                <li className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status="missing_evidence" />
                  <span className="text-[13px] text-muted-foreground">
                    A required item is missing. Not ready for review.
                  </span>
                </li>
                <li className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status="needs_clarification" />
                  <span className="text-[13px] text-muted-foreground">
                    Evidence present but inconsistent. Human clarification
                    needed.
                  </span>
                </li>
                <li className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status="review_ready" />
                  <span className="text-[13px] text-muted-foreground">
                    Complete and consistent. Ready for a human decision.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
          </div>
        </FadeContent>
      </section>

      {/* ── Live applications teaser ─────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-400">
              Product tour
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              Three applications, three outcomes
            </h2>
          </div>
          <Link
            href="/applications"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "ml-auto",
            })}
          >
            View all <ArrowRight data-icon="inline-end" aria-hidden />
          </Link>
        </div>
        <FadeContent blur duration={700} threshold={0.15}>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {DEMO_APPS.map((a) => (
            <Link
              key={a.id}
              href={`/applications/${a.id}`}
              className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-muted/50"
            >
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                {a.id}
              </span>
              <span className="mt-1 block text-base font-bold group-hover:underline">
                {a.name}
              </span>
              <span className="block text-[13px] text-muted-foreground">
                {a.programme} · {a.completion} complete · {a.note}
              </span>
              <span className="mt-3 block">
                <StatusBadge status={a.status} />
              </span>
            </Link>
          ))}
          </div>
        </FadeContent>
        <Alert className="mt-6">
          <ShieldCheck aria-hidden />
          <AlertTitle>Human oversight, by design</AlertTitle>
          <AlertDescription>
            AI analysis highlights gaps and inconsistencies only. Review Ready
            means evidence is complete and consistent — it is not an approval.
            A human reviewer makes every decision.
          </AlertDescription>
        </Alert>
      </section>

      {/* ── MCP teaser ───────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-5 py-4">
        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-6 sm:p-8 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase dark:text-blue-400">
              MCP server
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-balance sm:text-2xl">
              Bring your own LLM — 4 tools, 5-minute setup
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Connect Claude Desktop, MCP Inspector, or any MCP client to list,
              inspect, analyze, and draft requests — live API first, with a
              deterministic fallback so reviews keep working.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/mcp" className={buttonVariants()}>
              MCP setup guide
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-5 pt-4 pb-14">
        <FadeContent blur duration={800} threshold={0.2}>
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -top-20 left-1/4 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-24 right-1/5 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          </div>
          <h2 className="mx-auto mt-4 max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            See a full review cycle in minutes
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/90">
            Open the application queue, pick a flagged application, and walk the
            list → analyze → request → fix → Review Ready path.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/applications"
              className={buttonVariants({ size: "lg", variant: "secondary" })}
            >
              Get started
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
            <Link
              href="/applications/APP-102"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "border-white/20 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground",
              })}
            >
              <Send data-icon="inline-start" aria-hidden /> See an example
              case
              </Link>
            </div>
          </div>
        </FadeContent>
      </section>
    </div>
  );
}
