"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { CHILD_COOKIE } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

const YEAR = 60 * 60 * 24 * 365;

/** Switch UI language; remembered in a cookie and on the profile for signed-in users. */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR, sameSite: "lax" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await supabase.from("profiles").update({ locale }).eq("user_id", user.id);
  revalidatePath("/", "layout");
}

/** After sign-in: adopt the language saved on the profile unless the user already picked one. */
export async function syncLocaleFromProfile() {
  const store = await cookies();
  if (store.get(LOCALE_COOKIE)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase
    .from("profiles")
    .select("locale")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data?.locale && isLocale(data.locale)) {
    store.set(LOCALE_COOKIE, data.locale, { path: "/", maxAge: YEAR, sameSite: "lax" });
  }
}

/** Parent app child switcher. */
export async function selectChild(childId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(childId)) return;
  (await cookies()).set(CHILD_COOKIE, childId, {
    path: "/app",
    maxAge: YEAR,
    sameSite: "lax",
    httpOnly: true,
  });
  revalidatePath("/app", "layout");
}
