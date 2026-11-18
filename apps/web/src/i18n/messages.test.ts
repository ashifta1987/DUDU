import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ml from "../../messages/ml.json";
import hi from "../../messages/hi.json";
import { resolveLocale, withFallback } from "./config";

type Tree = { [k: string]: string | Tree };
const keys = (t: Tree, prefix = ""): string[] =>
  Object.entries(t).flatMap(([k, v]) =>
    typeof v === "string" ? [prefix + k] : keys(v, `${prefix}${k}.`),
  );
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const get = (t: Tree, path: string) =>
  path.split(".").reduce<string | Tree>((n, k) => (n as Tree)[k]!, t) as string;

/** Parent and child surfaces must be fully translated; admin is English-only. */
const TRANSLATED = (k: string) => !k.startsWith("admin.");

describe("messages", () => {
  const enKeys = keys(en as Tree).filter(TRANSLATED);
  for (const [name, msgs] of [
    ["ml", ml],
    ["hi", hi],
  ] as const) {
    it(`${name} has every parent/child key`, () => {
      const have = new Set(keys(msgs as Tree));
      expect(enKeys.filter((k) => !have.has(k))).toEqual([]);
    });
    it(`${name} has no stray keys`, () => {
      const want = new Set(enKeys);
      expect(keys(msgs as Tree).filter((k) => !want.has(k))).toEqual([]);
    });
    it(`${name} keeps the same {placeholders}`, () => {
      for (const k of enKeys)
        expect([k, placeholders(get(msgs as Tree, k))]).toEqual([
          k,
          placeholders(get(en as Tree, k)),
        ]);
    });
  }
});

describe("resolveLocale", () => {
  it("prefers the cookie", () => {
    expect(resolveLocale("ml", "hi-IN")).toBe("ml");
  });
  it("falls back to Accept-Language by quality", () => {
    expect(resolveLocale(undefined, "en-GB;q=0.5, hi-IN;q=0.9, ml;q=0.8")).toBe("hi");
    expect(resolveLocale("xx", "ml-IN,ml;q=0.9")).toBe("ml");
  });
  it("defaults to English", () => {
    expect(resolveLocale(undefined, "fr-FR")).toBe("en");
    expect(resolveLocale(null, null)).toBe("en");
  });
});

describe("withFallback", () => {
  it("fills missing keys from English", () => {
    const merged = withFallback({ a: "A", b: { c: "C", d: "D" } }, { b: { c: "സി" } });
    expect(merged).toEqual({ a: "A", b: { c: "സി", d: "D" } });
  });
});
