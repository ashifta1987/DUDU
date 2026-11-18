import { DuDuFace, DuDuWordmark } from "@dudu/ui";

export default function AdminHome() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink px-6 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <DuDuFace state="cool" size={140} />
        <DuDuWordmark height={30} ink="#FFFFFF" />
        <h1 className="text-xl font-bold">Admin</h1>
        <p className="text-sm text-white/70">
          Invitation‑only. Sign in with Google or a magic link.
        </p>
      </div>
    </main>
  );
}
