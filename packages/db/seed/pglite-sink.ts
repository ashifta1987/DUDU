import type { PGlite } from "@electric-sql/pglite";
import type { Row } from "./data";
import type { SeedSink } from "./apply";

/** Seed sink for PGlite / plain Postgres (used in tests). Runs as the database owner. */
export function pgliteSink(db: PGlite): SeedSink {
  return {
    async createUser(user) {
      const res = await db.query(
        `insert into auth.users (id, email, phone, raw_user_meta_data)
         values ($1, $2, $3, $4) on conflict (id) do nothing returning id`,
        [user.id, user.email, user.phone ?? null, JSON.stringify({ full_name: user.full_name })],
      );
      return res.rows.length ? "created" : "exists";
    },
    async upsert(table, rows, onConflict) {
      const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      const conflictCols = onConflict.split(",").map((c) => c.trim());
      const updates = cols.filter((c) => !conflictCols.includes(c) && c !== "id");
      const colList = cols.map((c) => `"${c}"`).join(", ");
      const normalized = rows.map((r) =>
        Object.fromEntries(cols.map((c) => [c, (r as Row)[c] ?? null])),
      );
      const sql = `
        insert into public."${table}" (${colList})
        select ${colList} from jsonb_populate_recordset(null::public."${table}", $1::jsonb)
        on conflict (${conflictCols.map((c) => `"${c}"`).join(", ")})
        ${updates.length ? `do update set ${updates.map((c) => `"${c}" = excluded."${c}"`).join(", ")}` : "do nothing"}`;
      await db.query(sql, [JSON.stringify(normalized)]);
    },
  };
}
