import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Flame, NotebookPen, Sparkles, Star } from "lucide-react";
import { DuDuFace } from "@dudu/ui";
import { requireKid } from "@/lib/auth/kid";
import { createAdminClient } from "@/lib/supabase/server";
import { KidFrame } from "@/components/shell/kid-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "DuDu", robots: { index: false } };

export default async function KidHome() {
  const { child } = await requireKid();
  const t = await getTranslations("kid");
  // Kid sessions have no Supabase JWT; read only this child's stats with the service role.
  const { data: stats } = await createAdminClient()
    .from("child_stats")
    .select("stars, streak_days, badges")
    .eq("child_id", child.id)
    .maybeSingle();

  return (
    <KidFrame>
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <DuDuFace state="excited" size={180} title="" />
        <div>
          <h1 className="text-4xl font-extrabold">{t("hello", { name: child.first_name })}</h1>
          <p className="mt-1 text-xl text-muted-text">{t("ready")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            <span className="inline-flex min-h-12 items-center gap-2 rounded-pill bg-orange-tint px-4 font-bold text-orange-dark">
              <Star className="size-6" aria-hidden />
              {t("stars", { n: stats?.stars ?? 0 })}
            </span>
            <span className="inline-flex min-h-12 items-center gap-2 rounded-pill bg-blue-tint px-4 font-bold text-blue">
              <Flame className="size-6" aria-hidden />
              {t("streak", { n: stats?.streak_days ?? 0 })}
            </span>
          </div>
        </div>
      </section>

      <h2 className="mt-10 text-2xl font-extrabold">{t("mission")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link
          href="/kid/quiz"
          className="group flex min-h-40 flex-col justify-between rounded-card-lg bg-orange p-6 text-white shadow-sm hover:bg-orange-dark"
        >
          <Sparkles className="size-10" aria-hidden />
          <span>
            <span className="block text-2xl font-extrabold">{t("quiz")}</span>
            <span className="text-lg text-white/90">{t("quizBody")}</span>
          </span>
        </Link>
        <Link
          href="/kid/homework"
          className="group flex min-h-40 flex-col justify-between rounded-card-lg bg-blue p-6 text-white shadow-sm hover:bg-blue/90"
        >
          <NotebookPen className="size-10" aria-hidden />
          <span>
            <span className="block text-2xl font-extrabold">{t("homework")}</span>
            <span className="text-lg text-white/90">{t("homeworkBody")}</span>
          </span>
        </Link>
      </div>

      {stats?.badges?.length ? (
        <>
          <h2 className="mt-10 text-2xl font-extrabold">{t("badges")}</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {stats.badges.map((b) => (
              <li
                key={b}
                className="rounded-pill bg-surface px-4 py-2 font-bold capitalize ring-1 ring-line"
              >
                {b.replace(/-/g, " ")}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <form action="/kid/exit" method="post" className="mt-auto pt-10 text-center">
        <button
          type="submit"
          className="min-h-touch text-base font-semibold text-muted-text underline underline-offset-4"
        >
          {t("notYou")}
        </button>
      </form>
    </KidFrame>
  );
}
