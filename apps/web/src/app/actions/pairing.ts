"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PairState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "taken";
  serial?: string;
};

/** Pair a DuDu by its on-screen 6-digit code (or QR token) for the signed-in parent's family. */
export async function pairDevice(_prev: PairState, form: FormData): Promise<PairState> {
  const raw = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(raw) && !/^[\w-]{16,}$/.test(raw))
    return { status: "error", error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rpc_pair_device", { code_or_token: raw });
  if (error) {
    return { status: "error", error: /another family/i.test(error.message) ? "taken" : "invalid" };
  }
  revalidatePath("/app", "layout");
  return { status: "success", serial: (data as { serial?: string } | null)?.serial };
}
