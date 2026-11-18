import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Tables } from "@dudu/db/types";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CHILD_COOKIE, isAdminRole, KID_COOKIE, type AdminRole } from "./routes";

export type Profile = Tables<"profiles">;

/** The signed-in user and profile for this request (memoised per request). */
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return { user, profile: profile as Profile | null, supabase };
});

export type ChildSummary = Pick<
  Tables<"children">,
  "id" | "first_name" | "class" | "board" | "avatar_color" | "languages"
>;

export interface ParentContext {
  userId: string;
  profile: Profile | null;
  displayName: string;
  family: Pick<Tables<"families">, "id" | "name" | "plan" | "trial_ends_at"> | null;
  children: ChildSummary[];
  child: ChildSummary | null;
}

/** For /app pages: signed-in user, their family, children and the currently selected child. */
export const requireParentContext = cache(async (): Promise<ParentContext> => {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { user, profile, supabase } = viewer;

  const { data: memberships } = await supabase
    .from("family_members")
    .select("role, families(id, name, plan, trial_ends_at)")
    .eq("user_id", user.id)
    .order("role", { ascending: true });
  const family = (memberships ?? []).map((m) => m.families).find(Boolean) ?? null;

  let children: ChildSummary[] = [];
  if (family) {
    const { data } = await supabase
      .from("children")
      .select("id, first_name, class, board, avatar_color, languages")
      .eq("family_id", family.id)
      .order("created_at");
    children = data ?? [];
  }
  const selectedId = (await cookies()).get(CHILD_COOKIE)?.value;
  const child = children.find((c) => c.id === selectedId) ?? children[0] ?? null;

  const displayName =
    profile?.full_name?.split(" ")[0] ||
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "";

  return { userId: user.id, profile, displayName, family, children, child };
});

/** For /admin pages. Middleware already guards; this re-checks on the server and returns the role. */
export const requireAdmin = cache(
  async (): Promise<{ userId: string; role: AdminRole; profile: Profile; email: string }> => {
    const viewer = await getViewer();
    if (!viewer) redirect("/admin/login");
    if (!viewer.profile || !isAdminRole(viewer.profile.role))
      redirect("/admin/login?error=not_authorized");
    return {
      userId: viewer.user.id,
      role: viewer.profile.role,
      profile: viewer.profile,
      email: viewer.user.email ?? "",
    };
  },
);

export interface KidSession {
  tokenId: string;
  child: Pick<
    Tables<"children">,
    "id" | "family_id" | "first_name" | "class" | "board" | "languages" | "avatar_color"
  >;
}

/** Child companion session from the link cookie, validated (and revocation-checked) in the DB. */
export const getKidSession = cache(async (): Promise<KidSession | null> => {
  const token = (await cookies()).get(KID_COOKIE)?.value;
  if (!token) return null;
  return resolveKidToken(token);
});

export async function resolveKidToken(token: string): Promise<KidSession | null> {
  const { data, error } = await createAdminClient().rpc("rpc_resolve_child_token", {
    p_token: token,
  });
  if (error || !data) return null;
  const d = data as { token_id: string; child: KidSession["child"] };
  return { tokenId: d.token_id, child: d.child };
}
