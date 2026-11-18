"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatIndianPhone, toIndianE164 } from "@/lib/auth/phone";
import { syncLocaleFromProfile } from "@/app/actions/preferences";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { GoogleMark } from "./google-mark";
import { PasswordLoginForm } from "./password-login-form";

const RESEND_SECONDS = 30;

export function ParentLoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [detail, setDetail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const fail = (message: string, err?: { message?: string } | null) => {
    setError(message);
    setDetail(err?.message ?? null);
  };

  const sendCode = (e164: string) =>
    startTransition(async () => {
      setError(null);
      setDetail(null);
      const { error: err } = await createClient().auth.signInWithOtp({
        phone: e164,
        options: { channel: "sms" },
      });
      if (err) return fail(t("genericError"), err);
      setPhone(e164);
      setStep("code");
      setCountdown(RESEND_SECONDS);
    });

  const onPhone = (e: FormEvent) => {
    e.preventDefault();
    const e164 = toIndianE164(phoneInput);
    if (!e164) return fail(t("invalidPhone"));
    sendCode(e164);
  };

  const onCode = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code) || !phone) return fail(t("invalidCode"));
    startTransition(async () => {
      setError(null);
      setDetail(null);
      const { error: err } = await createClient().auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });
      if (err) return fail(t("invalidCode"), err);
      await syncLocaleFromProfile();
      router.replace(next);
      router.refresh();
    });
  };

  const onGoogle = () =>
    startTransition(async () => {
      const { error: err } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (err) fail(t("genericError"), err);
    });

  return (
    <div className="space-y-6">
      {step === "phone" ? (
        <form onSubmit={onPhone} noValidate className="space-y-4">
          <div>
            <Label htmlFor="phone">{t("phoneLabel")}</Label>
            <div className="flex items-stretch gap-2">
              <span className="inline-flex min-h-touch items-center rounded-btn border border-line bg-ground px-3 font-semibold text-muted-text">
                +91
              </span>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={t("phonePlaceholder")}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "login-error" : undefined}
                required
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {t("sendCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={onCode} noValidate className="space-y-4">
          <p className="text-sm text-muted-text">
            {t("codeSentTo", { phone: phone ? formatIndianPhone(phone) : "" })}
          </p>
          <div>
            <Label htmlFor="code">{t("codeLabel")}</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-2xl font-bold tracking-[0.5em]"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              autoFocus
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {t("verify")}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
            >
              <ArrowLeft aria-hidden />
              {t("changeNumber")}
            </Button>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0"
              disabled={countdown > 0 || pending || !phone}
              onClick={() => phone && sendCode(phone)}
            >
              {countdown > 0 ? t("resendIn", { seconds: countdown }) : t("resend")}
            </Button>
          </div>
        </form>
      )}

      <FieldError id="login-error">
        {error}
        {detail ? (
          <span className="mt-1 block text-xs font-normal text-muted-text">{detail}</span>
        ) : null}
      </FieldError>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted-text">
        <span className="h-px flex-1 bg-line" />
        {t("or")}
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={onGoogle}
        disabled={pending}
      >
        <GoogleMark />
        {t("google")}
      </Button>

      {process.env.NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN === "true" ? (
        <PasswordLoginForm next={next} />
      ) : null}
    </div>
  );
}
