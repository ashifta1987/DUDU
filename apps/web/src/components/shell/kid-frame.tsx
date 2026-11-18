import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Child companion frame: no nav, big type, optional back button. */
export function KidFrame({
  children,
  back,
  backLabel,
}: {
  children: React.ReactNode;
  back?: string;
  backLabel?: string;
}) {
  return (
    <div className="font-child min-h-dvh bg-ground text-lg text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-6 sm:px-8">
        {back ? (
          <Link
            href={back}
            className="mb-4 inline-flex min-h-kid w-fit items-center gap-2 rounded-btn-lg bg-surface px-5 text-lg font-bold shadow-sm ring-1 ring-line hover:bg-orange-tint"
          >
            <ArrowLeft className="size-6" aria-hidden />
            {backLabel}
          </Link>
        ) : null}
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
