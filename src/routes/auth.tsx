import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Compass } from "lucide-react";

const search = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
});

function AuthPage() {
  const { mode = "signin", redirect } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate({ to: redirect || "/", replace: true });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
      fullName: mode === "signup" ? fd.get("fullName") : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsed.data.fullName ?? "" },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can now sign in.");
        navigate({ to: "/auth", search: { mode: "signin" } });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: redirect || "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-warm">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Compass className="h-5 w-5" />
          </div>
          <span className="font-display text-xl">Reclaim</span>
        </Link>
        <h1 className="font-display text-3xl">{mode === "signup" ? "Create account" : "Sign in"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signup" ? "Join the community to report and recover items." : "Welcome back."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required maxLength={100} placeholder="Jane Doe" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required maxLength={255} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} maxLength={72} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <Link
            to="/auth"
            search={{ mode: mode === "signup" ? "signin" : "signup" }}
            className="font-medium text-primary hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </div>
  );
}
