import { DuDuFace } from "@dudu/ui";

export default function KidHome() {
  return (
    <main className="font-child mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center text-lg">
      <DuDuFace state="excited" size={240} />
      <h1 className="text-4xl font-extrabold">Hi! Ready to learn with DuDu?</h1>
      <p className="text-muted-text">Ask a grown‑up to open your DuDu link to start.</p>
    </main>
  );
}
