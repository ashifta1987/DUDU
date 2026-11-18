import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SectionPage } from "@/components/shell/section-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  return { title: t("library.title") };
}

export default function LibraryPage() {
  return <SectionPage section="library" />;
}
