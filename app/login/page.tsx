"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        mode === "signin" ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
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

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "signin" ? "Sign in" : "Create account"}
          </CardTitle>
          <CardDescription>
            Reviewers check applications; applicants submit evidence. New
            accounts start as applicants; reviewers are promoted by an admin.
            Demo accounts: reviewer@demo.local / Reviewer123! and
            applicant@demo.local / Applicant123!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="login-email">Email address</FieldLabel>
              <Input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.org"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Input
                id="login-password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>
                  {mode === "signin" ? "Could not sign in" : "Could not register"}
                </AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" disabled={busy || !email.trim() || !password}>
              {busy ? (
                <>
                  <Spinner data-icon="inline-start" /> Working
                </>
              ) : mode === "signin" ? (
                <>
                  <LogIn data-icon="inline-start" aria-hidden /> Sign in
                </>
              ) : (
                <>
                  <UserPlus data-icon="inline-start" aria-hidden /> Create
                  account
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  No account yet?{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
