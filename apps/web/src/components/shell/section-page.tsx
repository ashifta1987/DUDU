import { getTranslations } from "next-intl/server";
import { DuDuFace } from "@dudu/ui";
import { EmptyState, PageHeader } from "@/components/page-header";

export type ParentSection =
  "study" | "reminders" | "monitor" | "homework" | "report" | "library" | "settings";

/** Shared frame for parent sections: translated header and an empty state until data arrives. */
export async function SectionPage({
  section,
  children,
}: {
  section: ParentSection;
  children?: React.ReactNode;
}) {
  const t = await getTranslations("pages");
  return (
    <>
      <PageHeader title={t(`${section}.title`)} description={t(`${section}.description`)} />
      {children ?? (
        <EmptyState
          icon={<DuDuFace state="curious" size={96} title="" />}
          title={t("emptyTitle")}
          body={t("emptyBody")}
        />
      )}
    </>
  );
}
