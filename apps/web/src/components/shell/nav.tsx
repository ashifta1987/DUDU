"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isActive, PARENT_NAV, PARENT_TABS } from "./nav-config";

/** Vertical nav used by the parent sidebar (light) and the admin sidebar (dark). */
export function SideNav({ nav }: { nav: "parent" | "admin" }) {
  const items = nav === "admin" ? ADMIN_NAV : PARENT_NAV;
  const tone = nav === "admin" ? "dark" : "light";
  const t = useTranslations(nav === "admin" ? "admin.nav" : "nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  return (
    <nav aria-label={tc("mainNav")}>
      <ul className="space-y-1">
        {items.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-touch items-center gap-3 rounded-btn px-3 text-sm font-semibold transition-colors",
                  tone === "light"
                    ? active
                      ? "bg-orange-tint text-orange-dark"
                      : "text-ink/80 hover:bg-ground hover:text-ink"
                    : active
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-5" strokeWidth={2} aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile bottom tab bar (< 768px). */
export function TabBar() {
  const items = PARENT_TABS;
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  return (
    <nav
      aria-label={tc("mainNav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                  active ? "text-orange-dark" : "text-muted-text",
                )}
              >
                <Icon className="size-6" strokeWidth={2} aria-hidden />
                <span className="max-w-full truncate px-1">{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
