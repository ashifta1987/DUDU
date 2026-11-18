import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readServerEnv } from "./env";

export * from "./env";

/**
 * Service-role client for trusted server contexts only (gateway, server routes, scripts).
 * Bypasses RLS — never import into client components.
 */
export function createServiceClient(env?: Record<string, string | undefined>): SupabaseClient {
  const e = readServerEnv(env);
  return createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
