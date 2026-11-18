import type { Row, SeedData, SeedUser } from "./data";

export interface SeedSink {
  createUser(user: SeedUser): Promise<"created" | "exists">;
  upsert(table: string, rows: Row[], onConflict: string): Promise<void>;
}

export interface SeedReport {
  users: { email: string; result: "created" | "exists" }[];
  tables: { table: string; rows: number }[];
}

/** Apply seed data through any sink, in dependency order. Idempotent. */
export async function applySeed(
  data: SeedData,
  sink: SeedSink,
  log: (msg: string) => void = () => {},
): Promise<SeedReport> {
  const report: SeedReport = { users: [], tables: [] };
  for (const user of data.users) {
    const result = await sink.createUser(user);
    report.users.push({ email: user.email, result });
    log(`user ${user.email} (${user.role}) ${result}`);
  }
  for (const { table, rows, onConflict } of data.tables) {
    if (rows.length === 0) continue;
    // chunk to keep request bodies small
    for (let i = 0; i < rows.length; i += 200) {
      await sink.upsert(table, rows.slice(i, i + 200), onConflict ?? "id");
    }
    report.tables.push({ table, rows: rows.length });
    log(`${table.padEnd(18)} ${rows.length}`);
  }
  return report;
}
