import { NextResponse, type NextRequest } from "next/server";
import { KID_COOKIE } from "@/lib/auth/routes";

/** Forget the child link on this screen. */
export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/kid/welcome", request.nextUrl.origin), {
    status: 303,
  });
  res.cookies.set(KID_COOKIE, "", { path: "/kid", maxAge: 0 });
  return res;
}
