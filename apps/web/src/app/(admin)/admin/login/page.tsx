import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DuDuFace, DuDuWordmark } from "@dudu/ui";
import { safeNext } from "@/lib/auth/routes";
import { getViewer } from "@/lib/auth/session";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const t = await getTranslations("admin.login");
  const tAuth = await getTranslations("auth");
  const viewer = await getViewer();
  const initialError =
    error === "not_authorized"
      ? t("notAuthorized")
      : error === "callback"
        ? tAuth("callbackError")
        : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink px-5 py-10 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <DuDuFace state="cool" size={104} title="" />
          <div className="mt-4">
            <DuDuWordmark height={30} ink="#FFFFFF" />
          </div>
          <h1 className="mt-2 text-lg font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-white/70">{t("subtitle")}</p>
        </div>
        <AdminLoginForm next={safeNext(next, "/admin")} initialError={initialError} />
        {viewer && error === "not_authorized" ? (
          <form action="/auth/signout" method="post" className="mt-6 text-center">
            <input type="hidden" name="to" value="admin" />
            <button
              type="submit"
              className="text-sm font-semibold text-white/80 underline underline-offset-4 hover:text-white"
            >
              {t("switchAccount", { who: viewer.user.email ?? viewer.user.phone ?? "" })}
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
