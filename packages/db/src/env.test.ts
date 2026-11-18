import { describe, expect, it } from "vitest";
import { projectRefFromUrl, readServerEnv } from "./env";

describe("env", () => {
  const good = {
    NEXT_PUBLIC_SUPABASE_URL: "https://hhfczwecdgdfxgxalsfl.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_xxxxxxxxxxxxxxxxxxxx",
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxx",
  };

  it("accepts a valid env", () => {
    expect(readServerEnv(good).NEXT_PUBLIC_SUPABASE_URL).toBe(good.NEXT_PUBLIC_SUPABASE_URL);
  });

  it("rejects a /rest/v1 URL", () => {
    expect(() =>
      readServerEnv({
        ...good,
        NEXT_PUBLIC_SUPABASE_URL: `${good.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      }),
    ).toThrow(/without \/rest\/v1/);
  });

  it("extracts the project ref", () => {
    expect(projectRefFromUrl(good.NEXT_PUBLIC_SUPABASE_URL)).toBe("hhfczwecdgdfxgxalsfl");
  });
});
