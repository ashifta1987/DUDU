"use client";

import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { selectChild } from "@/app/actions/preferences";
import type { ChildSummary } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

/** Shown when a family has two or more children. */
export function ChildSwitcher({
  childList,
  selectedId,
}: {
  childList: ChildSummary[];
  selectedId: string | null;
}) {
  const t = useTranslations("home");
  const [pending, startTransition] = useTransition();
  const [optimisticId, setOptimisticId] = useOptimistic(selectedId);
  if (childList.length < 2) return null;
  return (
    <div
      role="radiogroup"
      aria-label={t("childSwitcher")}
      className="flex gap-1 rounded-pill bg-ground p-1"
    >
      {childList.map((c) => {
        const active = c.id === optimisticId;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setOptimisticId(c.id);
                await selectChild(c.id);
              })
            }
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-pill px-3 text-sm font-semibold transition-colors",
              active ? "bg-surface text-ink shadow-sm" : "text-muted-text hover:text-ink",
            )}
          >
            <span
              aria-hidden
              className="grid size-6 place-items-center rounded-full text-xs font-bold text-white"
              style={{ background: c.avatar_color }}
            >
              {c.first_name.slice(0, 1)}
            </span>
            {c.first_name}
          </button>
        );
      })}
    </div>
  );
}
