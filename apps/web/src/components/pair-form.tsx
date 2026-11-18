"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { DuDuFace } from "@dudu/ui";
import { pairDevice, type PairState } from "@/app/actions/pairing";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";

export function PairForm() {
  const t = useTranslations("pair");
  const [state, action, pending] = useActionState<PairState, FormData>(pairDevice, {
    status: "idle",
  });

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center">
        <DuDuFace state="happy" size={140} title="" />
        <p className="text-xl font-bold">{t("success")}</p>
        <Button asChild size="lg">
          <Link href="/app">{t("goHome")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="code">{t("codeLabel")}</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="\d{6}"
          className="text-center text-3xl font-black tracking-[0.5em]"
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "pair-error" : undefined}
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {t("submit")}
      </Button>
      <FieldError id="pair-error">
        {state.status === "error" ? t(state.error ?? "invalid") : null}
      </FieldError>
    </form>
  );
}
