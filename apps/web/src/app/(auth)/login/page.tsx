import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DuDuFace, DuDuWordmark } from "@dudu/ui";
import { safeNext } from "@/lib/auth/routes";
import { ParentLoginForm } from "@/components/auth/parent-login-form";
import { LocaleSwitcher } from "@/components/locale-switcher";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const t = await getTranslations("auth");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" aria-label="DuDu home">
            <DuDuWordmark height={28} />
          </Link>
          <LocaleSwitcher />
        </div>
        <section className="rounded-card-lg border border-line bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <DuDuFace state="happy" size={112} title="" />
            <h1 className="mt-4 text-2xl font-black tracking-tight">{t("parentTitle")}</h1>
            <p className="mt-1 text-sm text-muted-text">{t("parentSubtitle")}</p>
          </div>
          <ParentLoginForm
            next={safeNext(next, "/app")}
            initialError={error ? t("callbackError") : undefined}
          />
        </section>
        <p className="mt-6 text-center text-xs text-muted-text">{t("terms")}</p>
      </div>
    </main>
  );
}
