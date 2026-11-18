import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { DuDuFace, DuDuWordmark } from "@dudu/ui";
import type { ParentContext } from "@/lib/auth/session";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ChildSwitcher } from "./child-switcher";
import { SideNav, TabBar } from "./nav";

export async function ParentShell({
  ctx,
  children,
}: {
  ctx: ParentContext;
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");
  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only z-50 rounded-btn bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t("skipToContent")}
      </a>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <Link href="/app" className="mb-8 flex items-center gap-2 px-2" aria-label="DuDu">
          <DuDuFace state="idle" size={40} title="" />
          <DuDuWordmark height={24} />
        </Link>
        <SideNav nav="parent" />
        <div className="mt-auto space-y-2 border-t border-line pt-4">
          <p
            className="truncate px-3 text-sm font-semibold text-ink"
            title={ctx.family?.name ?? undefined}
          >
            {ctx.profile?.full_name ?? ctx.displayName}
          </p>
          <LocaleSwitcher className="px-3" />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex min-h-touch w-full items-center gap-3 rounded-btn px-3 text-sm font-semibold text-muted-text hover:bg-ground hover:text-ink"
            >
              <LogOut className="size-5" aria-hidden />
              {t("signOut")}
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-ground/90 px-4 backdrop-blur md:px-8">
          <Link href="/app" className="flex items-center gap-2 md:hidden" aria-label="DuDu">
            <DuDuFace state="idle" size={32} title="" />
            <DuDuWordmark height={20} />
          </Link>
          <div className="hidden text-sm font-semibold text-muted-text md:block">
            {ctx.family?.name}
          </div>
          <ChildSwitcher childList={ctx.children} selectedId={ctx.child?.id ?? null} />
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      <TabBar />
    </div>
  );
}
