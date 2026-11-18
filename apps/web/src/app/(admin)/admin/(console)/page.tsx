import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AlertTriangle, Cpu, IndianRupee, Users, CreditCard } from "lucide-react";
import type { AdminOverview } from "@dudu/db/types";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin · Overview" };

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin.overview");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("v_admin_overview", {});
  const ov = data as AdminOverview | null;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {error || !ov ? (
        <Card role="alert" className="border-danger/30 bg-danger-tint text-danger">
          {error?.message ?? "No data"}
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Kpi
              icon={<Cpu aria-hidden />}
              label={t("activeDevices")}
              value={`${ov.kpis.active_devices} / ${ov.kpis.total_devices}`}
            />
            <Kpi icon={<Users aria-hidden />} label={t("dau")} value={String(ov.kpis.dau)} />
            <Kpi
              icon={<CreditCard aria-hidden />}
              label={t("paidSubs")}
              value={String(ov.kpis.paid_subs)}
            />
            <Kpi
              icon={<IndianRupee aria-hidden />}
              label={t("aiCostPerDevice")}
              value={inr.format(Number(ov.kpis.ai_cost_per_device_inr))}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning" aria-hidden />
                {t("needsAttention")}
              </CardTitle>
            </CardHeader>
            <ul className="space-y-2 text-sm">
              <li>{t("offlineDevices", { n: ov.needs_attention.offline_devices.length })}</li>
              <li>
                {t("openReviews", {
                  n: ov.needs_attention.open_safety_reviews,
                  high: ov.needs_attention.open_high_severity,
                })}
              </li>
              <li>{t("trialsEnding", { n: ov.needs_attention.trials_ending_3d })}</li>
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <div className="text-muted-text [&_svg]:size-5">{icon}</div>
      <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
      <p className="text-sm text-muted-text">{label}</p>
    </Card>
  );
}
