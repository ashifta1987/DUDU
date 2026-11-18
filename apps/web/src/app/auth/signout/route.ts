import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const to = form?.get("to") === "admin" ? "/admin/login" : "/login";
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL(to, request.nextUrl.origin), { status: 303 });
}
