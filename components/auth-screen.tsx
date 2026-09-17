"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Eye,
  EyeOff,
  FileCheck2,
  Lock,
  LogIn,
  Mail,
  PenLine,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const DEMO_ACCOUNTS = [
  { label: "Reviewer demo", email: "reviewer@demo.local", password: "Reviewer123!" },
  { label: "Applicant demo", email: "applicant@demo.local", password: "Applicant123!" },
] as const;

const EVIDENCE_POINTS = [
  { icon: FileCheck2, title: "Registration record", body: "Proof the organisation exists." },
  { icon: ClipboardList, title: "Activity plan", body: "What will happen, when, for whom." },
  { icon: PenLine, title: "Responsible-person signoff", body: "A named person stands behind it." },
] as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AuthScreen({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const mode = initialMode;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const emailError = touched && !isValidEmail(email) ? "Enter a valid email address." : null;
  const passwordError =
    touched && password.length < 6
      ? "Use at least 6 characters."
      : null;
  const canSubmit =
    isValidEmail(email) && password.length >= 6 && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValidEmail(email) || password.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        mode === "signin" ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        },
      );
      const data = (await res.json()) as { role?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not complete sign-in");
      router.push(data.role === "reviewer" ? "/applications" : "/my-application");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete sign-in");
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setTouched(false);
    setError(null);
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid overflow-hidden rounded-2xl border bg-card shadow-xl shadow-blue-900/5 lg:grid-cols-[1fr_1.1fr]">
        {/* ── Trust panel ─────────────────────────────── */}
        <aside className="relative overflow-hidden bg-primary p-6 text-primary-foreground sm:p-8 lg:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-16 size-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-10 size-72 rounded-full bg-blue-400/20 blur-3xl" />
          </div>
          <div className="relative flex h-full flex-col gap-6">
            <p className="flex items-center gap-2 text-sm font-bold">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              ReviewOS · Schmitz-Stiftungen
            </p>
            <div>
              <Badge variant="secondary" className="bg-white/15 text-primary-foreground">
                Synthetic Data
              </Badge>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
                {mode === "signin"
                  ? "Evidence review you can defend."
                  : "Start your application with confidence."}
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-primary-foreground/85">
                {mode === "signin"
                  ? "Sign in to check applications, request missing evidence, and move strong cases to Ready for programme review."
                  : "Create an applicant account to submit your three evidence items. Reviewers will guide you if anything is missing."}
              </p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {EVIDENCE_POINTS.map((point) => (
                <li
                  key={point.title}
                  className="flex items-start gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <point.icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{point.title}</span>
                    <span className="block text-[13px] text-primary-foreground/75">
                      {point.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-auto flex items-start gap-2 rounded-xl border border-white/15 bg-white/5 p-3 text-[13px] leading-snug text-primary-foreground/85">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              AI highlights gaps and inconsistencies only. A human reviewer makes
              every decision — AI never approves or rejects.
            </p>
          </div>
        </aside>

        {/* ── Form panel ──────────────────────────────── */}
        <div className="flex flex-col p-6 sm:p-8 lg:p-10">
          <div
            role="tablist"
            aria-label="Choose sign in or create account"
            className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm font-semibold"
          >
            <Link
              role="tab"
              aria-selected={mode === "signin"}
              href="/login"
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-colors",
                mode === "signin"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LogIn className="size-4" aria-hidden /> Sign in
            </Link>
            <Link
              role="tab"
              aria-selected={mode === "signup"}
              href="/register"
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-colors",
                mode === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <UserPlus className="size-4" aria-hidden /> Register
            </Link>
          </div>

          <h2 className="mt-6 text-xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your applicant account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue your review work."
              : "New accounts start as applicants; reviewers are promoted by an admin."}
          </p>

          <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="auth-email">Email address</FieldLabel>
              <div className="relative">
                <Mail
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={emailError ? true : undefined}
                  className="pl-8"
                />
              </div>
              <FieldError errors={emailError ? [{ message: emailError }] : []} />
            </Field>

            <Field>
              <div className="flex items-baseline justify-between gap-2">
                <FieldLabel htmlFor="auth-password">Password</FieldLabel>
                {mode === "signup" ? (
                  <span className="text-xs text-muted-foreground">Minimum 6 characters</span>
                ) : null}
              </div>
              <div className="relative">
                <Lock
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder={mode === "signin" ? "Your password" : "Choose a password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={passwordError ? true : undefined}
                  className="pr-10 pl-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </Button>
              </div>
              <FieldError errors={passwordError ? [{ message: passwordError }] : []} />
            </Field>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>
                  {mode === "signin" ? "Could not sign in" : "Could not register"}
                </AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
              {busy ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </>
              ) : mode === "signin" ? (
                <>
                  <LogIn data-icon="inline-start" aria-hidden /> Sign in
                </>
              ) : (
                <>
                  <UserPlus data-icon="inline-start" aria-hidden /> Create account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border bg-muted/50 p-4">
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
              Try the prototype instantly
              <Badge variant="secondary">Synthetic Data</Badge>
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              One click fills a fictional demo account — no real data involved.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <Button
                  key={demo.email}
                  type="button"
                  variant="outline"
                  onClick={() => fillDemo(demo)}
                  className="justify-start bg-card"
                >
                  <span className="min-w-0 text-left">
                    <span className="block text-[13px] font-semibold">{demo.label}</span>
                    <span className="block truncate font-mono text-xs font-normal text-muted-foreground">
                      {demo.email}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account yet?{" "}
                <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already registered?{" "}
                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
