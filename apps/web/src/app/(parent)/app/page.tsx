import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Battery, BookOpen, Flame, Gamepad2, Star, Timer, Volume2, Wifi } from "lucide-react";
import { DuDuFace, type FaceState } from "@dudu/ui";
import type { FamilyDashboard } from "@dudu/db/types";
import { requireParentContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatClock, greetingKey, istHour, wifiQuality } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/page-header";

const statusFace: Record<string, FaceState> = {
  online: "idle",
  sleeping: "sleep",
  offline: "wifi",
  paired: "pairing",
  provisioned: "pairing",
};

export default async function ParentHome() {
  const ctx = await requireParentContext();
  const t = await getTranslations("home");
  const locale = (await getLocale()) as Locale;
  const greeting = t(greetingKey(istHour()), { name: ctx.displayName });

  if (!ctx.family || !ctx.child) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{greeting}</h1>
        <EmptyState
          icon={<DuDuFace state="pairing" size={120} title="" />}
          title={t("noFamilyTitle")}
          body={t("noFamilyBody")}
          action={{ href: "/app/pair", label: t("pairCta") }}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("v_family_dashboard", { p_child_id: ctx.child.id });
  const dash = data as FamilyDashboard | null;
  const device = dash?.device ?? null;
  const wifi = wifiQuality(device?.wifi_rssi);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black tracking-tight md:text-3xl">{greeting}</h1>

      {device ? (
        <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <DuDuFace state={statusFace[device.status] ?? "idle"} size={132} title="" />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">
                {t("deviceTitle")} · {ctx.child.first_name}
              </h2>
              <Badge
                variant={
                  device.status === "online"
                    ? "success"
                    : device.status === "offline"
                      ? "danger"
                      : "neutral"
                }
              >
                {t(`status.${device.status}`)}
              </Badge>
              <Badge variant={device.mode === "study" ? "study" : "default"}>
                {device.mode === "study" ? (
                  <BookOpen className="size-3.5" aria-hidden />
                ) : (
                  <Gamepad2 className="size-3.5" aria-hidden />
                )}
                {device.mode === "study" ? t("modeStudy") : t("modeFun")}
              </Badge>
            </div>
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-btn bg-ground p-3">
                <dt className="flex items-center gap-1.5 text-muted-text">
                  <Battery className="size-4" aria-hidden />
                  {t("battery")}
                </dt>
                <dd className="mt-1 font-bold">
                  {device.battery_pct != null ? `${device.battery_pct}%` : "—"}
                </dd>
              </div>
              <div className="rounded-btn bg-ground p-3">
                <dt className="flex items-center gap-1.5 text-muted-text">
                  <Wifi className="size-4" aria-hidden />
                  {t("wifi")}
                </dt>
                <dd className="mt-1 font-bold">{wifi ? t(wifi) : "—"}</dd>
              </div>
              <div className="rounded-btn bg-ground p-3">
                <dt className="flex items-center gap-1.5 text-muted-text">
                  <Volume2 className="size-4" aria-hidden />
                  {t("volume")}
                </dt>
                <dd className="mt-1 font-bold">{device.volume_pct}%</dd>
              </div>
            </dl>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<DuDuFace state="pairing" size={96} title="" />}
          title={t("noDevice", { name: ctx.child.first_name })}
          action={{ href: "/app/pair", label: t("pairCta") }}
        />
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat
          icon={<Star className="size-5 text-orange" aria-hidden />}
          label={t("stars")}
          value={String(dash?.stats?.stars ?? 0)}
        />
        <Stat
          icon={<Flame className="size-5 text-orange" aria-hidden />}
          label={t("streak")}
          value={String(dash?.stats?.streak_days ?? 0)}
        />
        <Stat
          icon={<Timer className="size-5 text-blue" aria-hidden />}
          label={t("focusToday")}
          value={t("minutes", { n: dash?.today_focus_minutes ?? 0 })}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("todayPlan")}</CardTitle>
          </CardHeader>
          {dash?.schedule.length ? (
            <ul className="divide-y divide-line">
              {dash.schedule.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="font-semibold">{s.subject}</span>
                  <span className="flex items-center gap-2 text-sm text-muted-text">
                    {formatClock(s.start_time, locale)} – {formatClock(s.end_time, locale)}
                    <Badge variant={s.mode === "study" ? "study" : "default"}>
                      {s.mode === "study" ? t("modeStudy") : t("modeFun")}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-text">{t("noSchedule")}</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Link href="/app/reminders" className="hover:underline">
                {t("reminders")}
              </Link>
            </CardTitle>
          </CardHeader>
          {dash?.reminders.length ? (
            <ul className="divide-y divide-line">
              {dash.reminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="font-semibold">{r.title}</span>
                  <span className="text-sm text-muted-text">{formatClock(r.time, locale)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-text">{t("noReminders")}</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("latestHomework")}</CardTitle>
          </CardHeader>
          {dash?.latest_homework.length ? (
            <ul className="divide-y divide-line">
              {dash.latest_homework.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    <span className="block font-semibold">{h.title}</span>
                    <span className="text-sm text-muted-text">{h.subject}</span>
                  </span>
                  {h.result ? (
                    <Badge
                      variant={
                        h.result === "correct"
                          ? "success"
                          : h.result === "retry"
                            ? "danger"
                            : h.result === "explained"
                              ? "study"
                              : "default"
                      }
                    >
                      {t(`result.${h.result}`)}
                      {h.score ? ` · ${h.score}` : ""}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-text">{t("noHomework")}</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">{icon}</div>
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className="text-xs text-muted-text">{label}</p>
    </Card>
  );
}
