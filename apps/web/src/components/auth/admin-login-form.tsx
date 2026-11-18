"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { GoogleMark } from "./google-mark";
import { PasswordLoginForm } from "./password-login-form";

/** Admin sign-in: Google or magic link. Magic links never create accounts (invitation-only). */
export function AdminLoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const t = useTranslations("admin.login");
  const tAuth = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();
  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const onGoogle = () =>
    startTransition(async () => {
      const { error: err } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo(), queryParams: { prompt: "select_account" } },
      });
      if (err) setError(err.message);
    });

  const onMagic = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      const { error: err } = await createClient().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo() },
      });
      if (err) {
        setError(
          /signups? not allowed|not found|user not found/i.test(err.message)
            ? t("notInvited")
            : err.message,
        );
        return;
      }
      setSentTo(email.trim());
    });
  };

  return (
    <div className="space-y-5">
      <Button
        type="button"
        size="lg"
        className="w-full bg-white text-ink hover:bg-white/90"
        onClick={onGoogle}
        disabled={pending}
      >
        <GoogleMark />
        {t("google")}
      </Button>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-white/50">
        <span className="h-px flex-1 bg-white/15" />
        {tAuth("or")}
        <span className="h-px flex-1 bg-white/15" />
      </div>

      {sentTo ? (
        <p role="status" className="rounded-btn bg-white/10 p-4 text-sm text-white">
          {t("linkSent", { email: sentTo })}
        </p>
      ) : (
        <form onSubmit={onMagic} className="space-y-3">
          <div>
            <Label htmlFor="admin-email" className="text-white">
              {t("emailLabel")}
            </Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending || !email}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
            {t("sendLink")}
          </Button>
        </form>
      )}

      <FieldError id="admin-login-error">{error}</FieldError>

      {process.env.NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN === "true" ? (
        <PasswordLoginForm next={next} tone="dark" />
      ) : null}
    </div>
  );
}
