import { redirect } from "next/navigation";
import { getKidSession, type KidSession } from "@/lib/auth/session";

/** Validates the child link cookie against the DB (revocation/expiry) for every /kid page. */
export async function requireKid(): Promise<KidSession> {
  const session = await getKidSession();
  if (!session) redirect("/kid/welcome?error=invalid");
  return session;
}
