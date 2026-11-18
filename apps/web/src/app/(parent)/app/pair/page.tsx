import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DuDuFace } from "@dudu/ui";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { PairForm } from "@/components/pair-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pair");
  return { title: t("title") };
}

export default async function PairPage() {
  const t = await getTranslations("pair");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Card className="mx-auto max-w-md p-6 sm:p-8">
        <div className="mb-6 flex justify-center">
          <DuDuFace state="pairing" size={140} title="" />
        </div>
        <PairForm />
      </Card>
    </>
  );
}
