import type { Locale } from "@/i18n/config";

const intlLocale: Record<Locale, string> = { en: "en-IN", ml: "ml-IN", hi: "hi-IN" };

/** "16:30:00" → "4:30 pm" in the user's language. */
export function formatClock(time: string, locale: Locale): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(intlLocale[locale], {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
}

/** Hour of day in India for greetings. */
export function istHour(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Kolkata",
    }).format(now),
  );
}

export function greetingKey(
  hour: number,
): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  if (hour < 12) return "greetingMorning";
  if (hour < 17) return "greetingAfternoon";
  return "greetingEvening";
}

export function wifiQuality(
  rssi: number | null | undefined,
): "wifiStrong" | "wifiGood" | "wifiWeak" | null {
  if (rssi == null) return null;
  if (rssi >= -60) return "wifiStrong";
  if (rssi >= -72) return "wifiGood";
  return "wifiWeak";
}
