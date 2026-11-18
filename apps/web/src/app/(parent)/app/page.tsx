import { DuDuFace, DuDuWordmark } from "@dudu/ui";

export default function ParentHome() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <DuDuFace state="idle" size={160} />
      <DuDuWordmark height={32} />
      <h1 className="text-2xl font-bold">Parent app</h1>
      <p className="text-muted-text">Sign in to manage DuDu, schedules, reminders and reports.</p>
    </main>
  );
}
