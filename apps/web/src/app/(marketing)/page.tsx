import Link from "next/link";
import Image from "next/image";
import { DuDuFace, DuDuWordmark } from "@dudu/ui";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2" aria-label="DuDu home">
          <Image src="/brand/dudu-logo.png" alt="" width={36} height={36} priority />
          <DuDuWordmark height={26} />
        </Link>
        <nav className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app">Parents</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/#preorder">Pre‑order</Link>
          </Button>
        </nav>
      </header>

      <section className="grid flex-1 items-center gap-10 py-12 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Your child&apos;s <span className="text-orange">AI buddy</span> for study and play.
          </h1>
          <p className="text-lg text-muted-text">
            DuDu sits on the desk, helps with homework, asks fun quizzes and tells stories — for
            CBSE Class 1–10, in English, Malayalam and Hindi.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">Pre‑order DuDu</Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/brand">See DuDu&apos;s faces</Link>
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="rounded-card-lg bg-surface p-8 shadow-sm ring-1 ring-line">
            <DuDuFace state="happy" size={300} />
          </div>
        </div>
      </section>
    </main>
  );
}
