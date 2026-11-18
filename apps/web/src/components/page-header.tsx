import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  tone = "light",
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1
          className={cn(
            "text-2xl font-black tracking-tight md:text-3xl",
            tone === "dark" && "text-white",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-text">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body?: string;
  icon?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-muted-text">{icon}</div> : null}
      <p className="font-bold">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-sm text-muted-text">{body}</p> : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-4 inline-flex min-h-touch items-center rounded-btn bg-orange px-5 text-sm font-semibold text-white hover:bg-orange-dark"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
