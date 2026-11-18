"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { syncLocaleFromProfile } from "@/app/actions/preferences";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";

/** Dev/test only (NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=true): email + password for seeded @dudu.local accounts. */
export function PasswordLoginForm({
  next,
  tone = "light",
}: {
  next: string;
  tone?: "light" | "dark";
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const { error: err } = await createClient().auth.signInWithPassword({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (err) return setError(err.message);
      await syncLocaleFromProfile();
      router.replace(next);
      router.refresh();
    });
  };

  return (
    <details className={tone === "dark" ? "text-white/80" : "text-muted-text"}>
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide">
        {t("devTitle")}
      </summary>
      <form onSubmit={onSubmit} className="mt-3 space-y-3" data-testid="password-login">
        <div>
          <Label htmlFor="dev-email" className={tone === "dark" ? "text-white" : undefined}>
            {t("email")}
          </Label>
          <Input id="dev-email" name="email" type="email" autoComplete="username" required />
        </div>
        <div>
          <Label htmlFor="dev-password" className={tone === "dark" ? "text-white" : undefined}>
            {t("password")}
          </Label>
          <Input
            id="dev-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button
          type="submit"
          variant={tone === "dark" ? "default" : "outline"}
          className="w-full"
          disabled={pending}
        >
          {t("signIn")}
        </Button>
        <FieldError>{error}</FieldError>
      </form>
    </details>
  );
}
