"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { LOCALE_LABELS, LOCALES } from "@/i18n/config";
import { setLocale } from "@/app/actions/preferences";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  return (
    <label className={cn("relative inline-flex items-center gap-2 text-sm", className)}>
      <Languages className="size-4 shrink-0" aria-hidden />
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => startTransition(() => setLocale(e.target.value))}
        className={cn(
          "min-h-touch cursor-pointer appearance-none rounded-btn-sm bg-transparent pr-2 font-semibold focus-visible:outline-2 focus-visible:outline-ring",
          tone === "dark" ? "text-white" : "text-ink",
        )}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} className="text-ink">
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
