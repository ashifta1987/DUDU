import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine((u) => !u.includes("/rest/v1"), "Use the project base URL, without /rest/v1"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Validate Supabase env vars for server-side (service role) usage. Throws with a readable message. */
export function readServerEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid Supabase environment: ${issues}`);
  }
  return parsed.data;
}

/** Extract the project ref from a Supabase URL (https://<ref>.supabase.co). */
export function projectRefFromUrl(url: string): string {
  const host = new URL(url).hostname;
  const ref = host.split(".")[0];
  if (!ref || !host.endsWith(".supabase.co")) throw new Error(`Not a Supabase URL: ${url}`);
  return ref;
}
