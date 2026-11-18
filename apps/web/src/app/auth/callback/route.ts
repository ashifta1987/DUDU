import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/routes";
import { syncLocaleFromProfile } from "@/app/actions/preferences";

/** OAuth (Google) and magic-link landing: exchange the PKCE code for a session cookie. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"), "/app");
  const loginPath = next.startsWith("/admin") ? "/admin/login" : "/login";
  const code = url.searchParams.get("code");
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription || !code) {
    return NextResponse.redirect(new URL(`${loginPath}?error=callback`, url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`${loginPath}?error=callback`, url.origin));
  }
  await syncLocaleFromProfile();
  return NextResponse.redirect(new URL(next, url.origin));
}
