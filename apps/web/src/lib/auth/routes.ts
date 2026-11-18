export const ADMIN_ROLES = ["owner", "ops", "content", "support"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type UserRole = AdminRole | "parent";

export const KID_COOKIE = "dudu_kid";
export const CHILD_COOKIE = "dudu_child";

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

/** Only allow same-origin relative redirects ("/app/x"), never "//evil.com" or absolute URLs. */
export function safeNext(next: string | null | undefined, fallback = "/app"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  try {
    const u = new URL(next, "http://dudu.local");
    if (u.origin !== "http://dudu.local") return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}

export type Surface = "marketing" | "parent" | "kid" | "admin" | "auth";

export function surfaceOf(pathname: string): Surface {
  if (pathname === "/app" || pathname.startsWith("/app/")) return "parent";
  if (pathname === "/kid" || pathname.startsWith("/kid/")) return "kid";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/login" || pathname.startsWith("/auth/")) return "auth";
  return "marketing";
}

const KID_PUBLIC = ["/kid/welcome", "/kid/link"];
const ADMIN_PUBLIC = ["/admin/login"];

export type RouteDecision = { type: "next" } | { type: "redirect"; to: string };

/**
 * Route guard used by middleware. Pure so it can be unit-tested.
 * - /app/*   any signed-in user (parents; admins land on onboarding)
 * - /admin/* signed-in user whose profile role is an admin role
 * - /kid/*   a child link cookie (validated against the DB in the kid layout)
 */
export function decideRoute(input: {
  pathname: string;
  search?: string;
  userId: string | null;
  role: string | null;
  hasKidCookie: boolean;
}): RouteDecision {
  const { pathname, search = "", userId, role, hasKidCookie } = input;
  const here = encodeURIComponent(pathname + search);

  switch (surfaceOf(pathname)) {
    case "parent":
      return userId ? { type: "next" } : { type: "redirect", to: `/login?next=${here}` };
    case "admin":
      if (ADMIN_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return userId && isAdminRole(role) ? { type: "redirect", to: "/admin" } : { type: "next" };
      }
      if (!userId) return { type: "redirect", to: `/admin/login?next=${here}` };
      if (!isAdminRole(role)) return { type: "redirect", to: "/admin/login?error=not_authorized" };
      return { type: "next" };
    case "kid":
      if (KID_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/")))
        return { type: "next" };
      return hasKidCookie ? { type: "next" } : { type: "redirect", to: "/kid/welcome" };
    case "auth":
      if (pathname === "/login" && userId) return { type: "redirect", to: "/app" };
      return { type: "next" };
    default:
      return { type: "next" };
  }
}
