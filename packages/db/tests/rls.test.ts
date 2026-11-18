import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTestDb, DB_ROOT } from "../src/testing";

describe("rls.test.sql", () => {
  it("passes every RLS expectation", async () => {
    const db = await createTestDb();
    const sql = readFileSync(join(DB_ROOT, "tests", "rls.test.sql"), "utf8");
    const results = await db.exec(sql);
    const ok = results
      .flatMap((r) => r.rows)
      .find((row) => (row as { result?: string }).result === "RLS OK");
    expect(ok).toBeTruthy();
    await db.close();
  }, 60_000);
});
