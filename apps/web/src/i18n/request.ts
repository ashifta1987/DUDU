import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, resolveLocale, withFallback } from "./config";
import en from "../../messages/en.json";

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  // The admin console is English-only; middleware marks those requests.
  const forced = headerStore.get("x-dudu-locale");
  const locale =
    forced === "en"
      ? "en"
      : resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get("accept-language"));
  const messages =
    locale === "en"
      ? en
      : withFallback(en, (await import(`../../messages/${locale}.json`)).default);
  return { locale, messages, timeZone: "Asia/Kolkata" };
});
