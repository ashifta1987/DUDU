import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState, PageHeader } from "@/components/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: `Admin · ${t("aiUsage")}` };
}

export default async function Page() {
  const t = await getTranslations("admin");
  const tp = await getTranslations("pages");
  return (
    <>
      <PageHeader title={t("nav.aiUsage")} description={t("pages.aiUsage")} />
      <EmptyState title={tp("emptyTitle")} />
    </>
  );
}
