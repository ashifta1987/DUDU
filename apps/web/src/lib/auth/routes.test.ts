import { describe, expect, it } from "vitest";
import { decideRoute, isAdminRole, safeNext, surfaceOf } from "./routes";

const base = { search: "", userId: null, role: null, hasKidCookie: false };

describe("safeNext", () => {
  it("keeps relative paths", () => {
    expect(safeNext("/app/reminders?tab=today")).toBe("/app/reminders?tab=today");
  });
  it("rejects open redirects", () => {
    for (const bad of [
      "//evil.com",
      "https://evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "",
      null,
    ]) {
      expect(safeNext(bad as string | null)).toBe("/app");
    }
  });
});

describe("surfaceOf", () => {
  it("maps route groups", () => {
    expect(surfaceOf("/")).toBe("marketing");
    expect(surfaceOf("/application")).toBe("marketing");
    expect(surfaceOf("/app")).toBe("parent");
    expect(surfaceOf("/app/study")).toBe("parent");
    expect(surfaceOf("/kid/quiz")).toBe("kid");
    expect(surfaceOf("/admin/devices")).toBe("admin");
    expect(surfaceOf("/login")).toBe("auth");
  });
});

describe("decideRoute", () => {
  it("sends anonymous parents to login with next", () => {
    expect(decideRoute({ ...base, pathname: "/app/study", search: "?a=1" })).toEqual({
      type: "redirect",
      to: "/login?next=%2Fapp%2Fstudy%3Fa%3D1",
    });
  });
  it("lets signed-in users into /app", () => {
    expect(decideRoute({ ...base, pathname: "/app", userId: "u" })).toEqual({ type: "next" });
  });
  it("bounces signed-in users away from /login", () => {
    expect(decideRoute({ ...base, pathname: "/login", userId: "u" })).toEqual({
      type: "redirect",
      to: "/app",
    });
  });
  it("guards admin by role", () => {
    expect(decideRoute({ ...base, pathname: "/admin/devices" })).toEqual({
      type: "redirect",
      to: "/admin/login?next=%2Fadmin%2Fdevices",
    });
    expect(decideRoute({ ...base, pathname: "/admin", userId: "u", role: "parent" })).toEqual({
      type: "redirect",
      to: "/admin/login?error=not_authorized",
    });
    for (const role of ["owner", "ops", "content", "support"]) {
      expect(decideRoute({ ...base, pathname: "/admin/safety", userId: "u", role })).toEqual({
        type: "next",
      });
    }
  });
  it("keeps admin login public but skips it for admins", () => {
    expect(decideRoute({ ...base, pathname: "/admin/login" })).toEqual({ type: "next" });
    expect(decideRoute({ ...base, pathname: "/admin/login", userId: "u", role: "parent" })).toEqual(
      { type: "next" },
    );
    expect(decideRoute({ ...base, pathname: "/admin/login", userId: "u", role: "ops" })).toEqual({
      type: "redirect",
      to: "/admin",
    });
  });
  it("requires a child link cookie for /kid", () => {
    expect(decideRoute({ ...base, pathname: "/kid" })).toEqual({
      type: "redirect",
      to: "/kid/welcome",
    });
    expect(decideRoute({ ...base, pathname: "/kid/quiz", hasKidCookie: true })).toEqual({
      type: "next",
    });
    expect(decideRoute({ ...base, pathname: "/kid/welcome" })).toEqual({ type: "next" });
    expect(decideRoute({ ...base, pathname: "/kid/link" })).toEqual({ type: "next" });
  });
  it("leaves marketing alone", () => {
    expect(decideRoute({ ...base, pathname: "/privacy" })).toEqual({ type: "next" });
  });
});

describe("isAdminRole", () => {
  it("excludes parents", () => {
    expect(isAdminRole("parent")).toBe(false);
    expect(isAdminRole("support")).toBe(true);
    expect(isAdminRole(null)).toBe(false);
  });
});
