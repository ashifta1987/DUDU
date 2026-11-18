export const LOCALES = ["en", "ml", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ml: "മലയാളം",
  hi: "हिन्दी",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Cookie wins; otherwise the best match from Accept-Language; otherwise English. */
export function resolveLocale(
  cookieValue: string | undefined | null,
  acceptLanguage?: string | null,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  if (acceptLanguage) {
    const ranked = acceptLanguage
      .split(",")
      .map((part) => {
        const [tag = "", ...params] = part.trim().split(";");
        const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1);
        return { lang: tag.toLowerCase().split("-")[0] ?? "", q: Number.isFinite(q) ? q : 0 };
      })
      .sort((a, b) => b.q - a.q);
    for (const { lang } of ranked) if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

type Messages = { [key: string]: string | Messages };

/** Deep-merge locale messages over English so any missing key falls back to English. */
export function withFallback(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(override)) {
    const b = base[k];
    out[k] = typeof v === "object" && typeof b === "object" ? withFallback(b, v) : v;
  }
  return out;
}
