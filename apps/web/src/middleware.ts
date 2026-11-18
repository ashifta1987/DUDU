import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { decideRoute, KID_COOKIE, surfaceOf } from "@/lib/auth/routes";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const surface = surfaceOf(pathname);

  // Forward request headers (admin console is English-only).
  const requestHeaders = new Headers(request.headers);
  if (surface === "admin") requestHeaders.set("x-dudu-locale", "en");
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Marketing pages need no session work.
  if (surface === "marketing") return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session cookie if needed. Must run before any redirect decision.
  const {
    data: { user },
  } = surface === "kid" ? { data: { user: null } } : await supabase.auth.getUser();

  let role: string | null = null;
  if (user && surface === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    role = data?.role ?? null;
  }

  const decision = decideRoute({
    pathname,
    search,
    userId: user?.id ?? null,
    role,
    hasKidCookie: Boolean(request.cookies.get(KID_COOKIE)?.value),
  });

  if (decision.type === "redirect") {
    const redirect = NextResponse.redirect(new URL(decision.to, request.url));
    // keep any refreshed auth cookies
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|json)$).*)",
  ],
};
