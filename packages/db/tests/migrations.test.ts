import { describe, expect, it } from "vitest";
import { createTestDb } from "../src/testing";

describe("migrations", () => {
  it("apply cleanly and enable RLS on every public table", async () => {
    const db = await createTestDb();
    const { rows } = await db.query<{ tablename: string; rowsecurity: boolean }>(
      "select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename",
    );
    expect(rows.map((r) => r.tablename)).toEqual([
      "ai_usage_daily",
      "audit_log",
      "child_stats",
      "children",
      "content_packs",
      "conversations",
      "devices",
      "families",
      "family_members",
      "firmware_releases",
      "homework_items",
      "media_library",
      "model_routes",
      "pairing_codes",
      "preorders",
      "profiles",
      "prompts",
      "quizzes",
      "reminders",
      "safety_reviews",
      "schedules",
      "sessions",
      "settings",
      "snapshots",
      "subscriptions",
      "turns",
    ]);
    const withoutRls = rows.filter((r) => !r.rowsecurity).map((r) => r.tablename);
    expect(withoutRls).toEqual([]);
    await db.close();
  }, 60_000);
});
