/**
 * Phase 2 smoke check: route guards + rendered pages for anonymous, parent, admin users.
 * Signs in with the seeded @dudu.local test accounts (SEED_TEST_PASSWORD), builds @supabase/ssr cookies
 * and requests pages from the running dev server. Prints no secrets.
 */
import { createServerClient } from "@supabase/ssr";

process.loadEnvFile("/Users/ashifabdulkhadar/Desktop/DUDU/.env.local");
const BASE = process.env.SMOKE_BASE ?? "http://localhost:3100";

async function cookiesFor(email: string): Promise<string> {
  const jar = new Map<string, string>();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (list) =>
          list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
      },
    },
  );
  const { error } = await sb.auth.signInWithPassword({
    email,
    password: process.env.SEED_TEST_PASSWORD!,
  });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function get(path: string, cookie = "", headers: Record<string, string> = {}) {
  const res = await fetch(BASE + path, { redirect: "manual", headers: { cookie, ...headers } });
  const body = res.status === 200 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), body };
}

let failures = 0;
function check(name: string, ok: boolean, info = "") {
  console.info(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${info}`}`);
  if (!ok) failures++;
}

// anonymous
for (const [path, to] of [
  ["/app", "/login?next=%2Fapp"],
  ["/app/reminders", "/login?next=%2Fapp%2Freminders"],
  ["/admin", "/admin/login?next=%2Fadmin"],
  ["/admin/devices", "/admin/login?next=%2Fadmin%2Fdevices"],
  ["/kid", "/kid/welcome"],
] as const) {
  const r = await get(path);
  check(`anon ${path} → ${to}`, r.status === 307 && r.location === to, `${r.status} ${r.location}`);
}
for (const path of ["/", "/login", "/admin/login", "/kid/welcome"]) {
  const r = await get(path);
  check(`anon ${path} 200`, r.status === 200, String(r.status));
}
const bad = await get("/kid/link?t=nope");
check(
  "bad kid link → welcome?error",
  bad.status === 307 && bad.location?.endsWith("/kid/welcome?error=invalid") === true,
  `${bad.status} ${bad.location}`,
);

// parent (Menon family: 2 children, device online)
const parent = await cookiesFor("anjali.menon@dudu.local");
const home = await get("/app", parent);
check("parent /app 200", home.status === 200, String(home.status));
check("parent home shows device serial status", /Online/.test(home.body), "no Online badge");
check(
  "parent home shows child switcher (2 children)",
  /role="radiogroup"/.test(home.body) && /Diya/.test(home.body),
);
check("parent home has stars 128", />128</.test(home.body));
for (const p of [
  "/app/study",
  "/app/reminders",
  "/app/monitor",
  "/app/homework",
  "/app/report",
  "/app/library",
  "/app/settings",
  "/app/more",
  "/app/pair",
]) {
  const r = await get(p, parent);
  check(`parent ${p} 200`, r.status === 200, String(r.status));
}
const loginBounce = await get("/login", parent);
check(
  "signed-in /login → /app",
  loginBounce.status === 307 && loginBounce.location === "/app",
  `${loginBounce.status}`,
);
const parentAdmin = await get("/admin", parent);
check(
  "parent /admin → not_authorized",
  parentAdmin.status === 307 && parentAdmin.location === "/admin/login?error=not_authorized",
  `${parentAdmin.status} ${parentAdmin.location}`,
);

// language: Malayalam cookie translates the parent app
const ml = await get("/app", `${parent}; NEXT_LOCALE=ml`);
check("parent /app in Malayalam", /lang="ml"/.test(ml.body) && /ബാറ്ററി/.test(ml.body));
const hi = await get("/app", `${parent}; NEXT_LOCALE=hi`);
check("parent /app in Hindi", /lang="hi"/.test(hi.body) && /बैटरी/.test(hi.body));

// admin
const admin = await cookiesFor("qa.admin@dudu.local");
const ov = await get("/admin", admin);
check("admin /admin 200", ov.status === 200, String(ov.status));
check(
  "admin overview KPIs render",
  /Active devices/.test(ov.body) && /Paid subscriptions/.test(ov.body),
);
const adminMl = await get("/admin", `${admin}; NEXT_LOCALE=ml`);
check("admin stays English", /lang="en"/.test(adminMl.body) && /Overview/.test(adminMl.body));
for (const p of [
  "/admin/devices",
  "/admin/families",
  "/admin/content",
  "/admin/subscriptions",
  "/admin/ai-usage",
  "/admin/safety",
]) {
  const r = await get(p, admin);
  check(`admin ${p} 200`, r.status === 200, String(r.status));
}
const adminLogin = await get("/admin/login", admin);
check(
  "admin /admin/login → /admin",
  adminLogin.status === 307 && adminLogin.location === "/admin",
  `${adminLogin.status}`,
);

console.info(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
