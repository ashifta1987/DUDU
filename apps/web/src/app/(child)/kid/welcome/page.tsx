import { getTranslations } from "next-intl/server";
import { DuDuFace } from "@dudu/ui";
import { KidFrame } from "@/components/shell/kid-frame";

export const metadata = { title: "DuDu", robots: { index: false } };

export default async function KidWelcome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = await getTranslations("kid");
  return (
    <KidFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <DuDuFace state={error ? "confused" : "wake"} size={260} title="" />
        <h1 className="text-4xl font-extrabold">{t("welcomeTitle")}</h1>
        <p role={error ? "alert" : undefined} className="max-w-md text-xl text-muted-text">
          {error ? t("invalidLink") : t("welcomeBody")}
        </p>
      </div>
    </KidFrame>
  );
}
