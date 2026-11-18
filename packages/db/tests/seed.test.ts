import { describe, expect, it } from "vitest";
import { createTestDb } from "../src/testing";
import { buildSeed, seedId } from "../seed/data";
import { applySeed } from "../seed/apply";
import { pgliteSink } from "../seed/pglite-sink";
import { hashDeviceSecret, verifyDeviceSecret } from "../src/device-secret";

const PEPPER = "test-pepper-0123456789";
const serials = ["DB01-2611-0001", "DB02-2611-0002", "DB03-2611-0003", "DB04-2611-0004"];
const hashes = Object.fromEntries(serials.map((s) => [s, hashDeviceSecret(`secret-${s}`, PEPPER)]));

describe("seed", () => {
  it("loads into the migrated schema, is idempotent and matches the spec counts", async () => {
    const db = await createTestDb();
    const data = buildSeed({ now: new Date("2026-11-18T12:30:00Z"), deviceSecretHashes: hashes });
    await applySeed(data, pgliteSink(db));
    await applySeed(data, pgliteSink(db)); // second run must not fail or duplicate

    const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0]!.n);
    expect(await count("select count(*) n from public.profiles where role = 'owner'")).toBe(1);
    expect(await count("select count(*) n from public.families")).toBe(3);
    expect(await count("select count(*) n from public.devices")).toBe(4);
    expect(await count("select count(distinct model) n from public.devices")).toBe(4);
    expect(await count("select count(*) n from public.prompts where status = 'live'")).toBe(5);
    expect(await count("select count(*) n from public.media_library")).toBe(10);
    expect(await count("select count(distinct date) n from public.ai_usage_daily")).toBe(30);
    expect(
      await count(
        "select jsonb_array_length(c -> 'quiz_bank') n from public.content_packs p, jsonb_array_elements(p.chapters_json) c where p.board = 'cbse' and p.class = 5 and c ->> 'id' = 'm5-04'",
      ),
    ).toBe(20);
    // the family creator became an owner member, plus the seeded guardian
    expect(
      await count(
        `select count(*) n from public.family_members where family_id = '${seedId("family:menon")}'`,
      ),
    ).toBe(2);

    await db.close();
  }, 60_000);

  it("produces a dashboard and admin overview from seed data", async () => {
    const db = await createTestDb();
    const data = buildSeed({ deviceSecretHashes: hashes });
    await applySeed(data, pgliteSink(db));
    const parent = data.users.find((u) => u.email.startsWith("anjali"))!;
    const owner = data.users.find((u) => u.role === "owner")!;

    await db.exec(
      `select set_config('request.jwt.claims', '{"sub":"${parent.id}","role":"authenticated"}', false); set role authenticated;`,
    );
    const dash = (
      await db.query<{ d: Record<string, unknown> }>(
        `select public.v_family_dashboard('${seedId("child:aarav")}') d`,
      )
    ).rows[0]!.d;
    expect((dash.child as { first_name: string }).first_name).toBe("Aarav");
    expect((dash.device as { serial: string }).serial).toBe("DB01-2611-0001");
    expect((dash.stats as { stars: number }).stars).toBe(128);
    expect((dash.latest_homework as unknown[]).length).toBe(3);

    // parent pairs the provisioned DB-04 with the seeded code
    const paired = (
      await db.query<{ d: { family_id: string } }>(
        `select public.rpc_pair_device('${data.pairing.code6}', '${seedId("child:diya")}') d`,
      )
    ).rows[0]!.d;
    expect(paired.family_id).toBe(seedId("family:menon"));

    await db.exec(
      `reset role; select set_config('request.jwt.claims', '{"sub":"${owner.id}","role":"authenticated"}', false); set role authenticated;`,
    );
    const ov = (
      await db.query<{ o: { kpis: Record<string, number>; conversations_per_day: unknown[] } }>(
        "select public.v_admin_overview() o",
      )
    ).rows[0]!.o;
    expect(Number(ov.kpis.total_devices)).toBe(4);
    expect(Number(ov.kpis.paid_subs)).toBe(2);
    expect(Number(ov.kpis.ai_cost_inr)).toBeGreaterThan(0);
    expect(ov.conversations_per_day).toHaveLength(30);
    await db.close();
  }, 60_000);

  it("verifies device secrets with the pepper", () => {
    expect(verifyDeviceSecret("secret-DB01-2611-0001", hashes["DB01-2611-0001"]!, PEPPER)).toBe(
      true,
    );
    expect(verifyDeviceSecret("wrong", hashes["DB01-2611-0001"]!, PEPPER)).toBe(false);
  });
});
