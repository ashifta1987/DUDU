import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/shell/admin-shell";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const { role, email } = await requireAdmin();
  return (
    <AdminShell role={role} email={email}>
      {children}
    </AdminShell>
  );
}
