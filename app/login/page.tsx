"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
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
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setRegistered(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.push("/post-login");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not complete sign-in",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!supabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md">
        <Alert variant="destructive">
          <AlertTitle>Sign-in unavailable</AlertTitle>
          <AlertDescription>
            Supabase is not configured in this environment. The prototype works
            without sign-in using local demo data.{" "}
            <button
              className="underline underline-offset-2"
              onClick={() => router.push("/applications")}
            >
              Continue to the prototype
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registered ? (
            <Alert>
              <AlertTitle>Account created</AlertTitle>
              <AlertDescription>
                {email.trim()} is registered as an applicant. If email
                confirmation is on, follow the link in your inbox, then sign
                in. Ask an admin to promote reviewer accounts.
              </AlertDescription>
            </Alert>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
