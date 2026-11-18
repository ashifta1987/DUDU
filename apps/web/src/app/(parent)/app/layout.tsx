import { requireParentContext } from "@/lib/auth/session";
import { ParentShell } from "@/components/shell/parent-shell";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireParentContext();
  return <ParentShell ctx={ctx}>{children}</ParentShell>;
}
