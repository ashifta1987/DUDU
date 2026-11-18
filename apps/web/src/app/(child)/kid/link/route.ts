import { NextResponse, type NextRequest } from "next/server";
import { KID_COOKIE } from "@/lib/auth/routes";
import { resolveKidToken } from "@/lib/auth/session";

/**
 * Child companion link: /kid/link?t=<token> (from the QR/link in the parent app).
 * Validates the token, stores it in an httpOnly cookie and drops it from the URL.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t")?.trim() ?? "";
  const origin = request.nextUrl.origin;
  if (!/^[0-9a-f]{64,128}$/i.test(token)) {
    return NextResponse.redirect(new URL("/kid/welcome?error=invalid", origin));
  }
  const session = await resolveKidToken(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/kid/welcome?error=invalid", origin));
    res.cookies.delete(KID_COOKIE);
    return res;
  }
  const res = NextResponse.redirect(new URL("/kid", origin));
  res.cookies.set(KID_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/kid",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
