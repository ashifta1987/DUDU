import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { DuDuFace, DuDuWordmark } from "@dudu/ui";
import type { AdminRole } from "@/lib/auth/routes";
import { SideNav } from "./nav";

export async function AdminShell({
  role,
  email,
  children,
}: {
  role: AdminRole;
  email: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("admin");
  const tc = await getTranslations("common");
  return (
    <div className="min-h-dvh bg-ground lg:flex">
      <a
        href="#main"
        className="sr-only z-50 rounded-btn bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {tc("skipToContent")}
      </a>
      <aside className="flex flex-col bg-ink px-4 py-5 text-white lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:py-6">
        <Link
          href="/admin"
          className="mb-4 flex items-center gap-2 px-2 lg:mb-8"
          aria-label={t("title")}
        >
          <DuDuFace state="cool" size={36} title="" />
          <DuDuWordmark height={22} ink="#FFFFFF" />
          <span className="ml-1 rounded-pill bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/80">
            Admin
          </span>
        </Link>
        <div className="-mx-1 overflow-x-auto lg:mx-0 lg:overflow-visible">
          <SideNav nav="admin" />
        </div>
        <div className="mt-4 border-t border-white/10 pt-4 lg:mt-auto">
          <p className="truncate px-3 text-sm font-semibold" title={email}>
            {email}
          </p>
          <p className="px-3 text-xs text-white/60">{t(`roles.${role}`)}</p>
          <form action="/auth/signout" method="post" className="mt-2">
            <input type="hidden" name="to" value="admin" />
            <button
              type="submit"
              className="flex min-h-touch w-full items-center gap-3 rounded-btn px-3 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="size-5" aria-hidden />
              {tc("signOut")}
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-8">
        {children}
      </main>
    </div>
  );
}
