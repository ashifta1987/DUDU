import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeedSink } from "./apply";

/** Seed sink for a real Supabase project (service-role client). */
export function supabaseSink(sb: SupabaseClient, opts: { parentPassword?: string } = {}): SeedSink {
  return {
    async createUser(user) {
      const { data: existing, error: getErr } = await sb.auth.admin.getUserById(user.id);
      if (existing?.user) return "exists";
      if (getErr && getErr.status !== 404 && !/not found/i.test(getErr.message)) throw getErr;
      const { error } = await sb.auth.admin.createUser({
        id: user.id,
        email: user.email,
        email_confirm: true,
        ...(user.phone ? { phone: user.phone, phone_confirm: true } : {}),
        ...(opts.parentPassword && user.role === "parent" ? { password: opts.parentPassword } : {}),
        user_metadata: { full_name: user.full_name, locale: user.locale ?? "en" },
      });
      if (error) throw new Error(`createUser ${user.email}: ${error.message}`);
      return "created";
    },
    async upsert(table, rows, onConflict) {
      const { error } = await sb.from(table).upsert(rows, { onConflict, ignoreDuplicates: false });
      if (error)
        throw new Error(
          `upsert ${table}: ${error.message}${error.details ? ` (${error.details})` : ""}`,
        );
    },
  };
}
