import { getTranslations } from "next-intl/server";
import { DuDuFace } from "@dudu/ui";
import { requireKid } from "@/lib/auth/kid";
import { KidFrame } from "@/components/shell/kid-frame";

export const dynamic = "force-dynamic";
export const metadata = { title: "DuDu", robots: { index: false } };

export default async function KidHomeworkPage() {
  await requireKid();
  const t = await getTranslations("kid");
  return (
    <KidFrame back="/kid" backLabel={t("back")}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <DuDuFace state="story" size={220} title="" />
        <h1 className="text-4xl font-extrabold">{t("homework")}</h1>
        <p className="text-xl text-muted-text">{t("homeworkBody")}</p>
      </div>
    </KidFrame>
  );
}
