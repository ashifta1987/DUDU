import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, LogOut } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PARENT_MORE } from "@/components/shell/nav-config";

export default async function MorePage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader title={t("pages.more.title")} description={t("pages.more.description")} />
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {PARENT_MORE.map(({ href, key, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-14 items-center gap-3 px-4 font-semibold hover:bg-ground"
            >
              <Icon className="size-5 text-muted-text" aria-hidden />
              <span className="flex-1">{t(`nav.${key}`)}</span>
              <ChevronRight className="size-5 text-muted-text" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex min-h-14 items-center justify-between px-4">
          <span className="font-semibold">{t("common.language")}</span>
          <LocaleSwitcher />
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex min-h-14 w-full items-center gap-3 px-4 font-semibold text-danger hover:bg-danger-tint"
          >
            <LogOut className="size-5" aria-hidden />
            {t("common.signOut")}
          </button>
        </form>
      </div>
    </>
  );
}
