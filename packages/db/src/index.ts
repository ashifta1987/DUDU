import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readServerEnv } from "./env";
import type { Database } from "./types.gen";

export * from "./env";
export * from "./device-secret";
export * from "./views";
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./types.gen";
export { Constants } from "./types.gen";

export type DuDuClient = SupabaseClient<Database>;

/**
 * Service-role client for trusted server contexts only (gateway, server routes, scripts).
 * Bypasses RLS — never import into client components.
 */
export function createServiceClient(env?: Record<string, string | undefined>): DuDuClient {
  const e = readServerEnv(env);
  return createClient<Database>(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
