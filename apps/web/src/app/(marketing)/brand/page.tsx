import type { Metadata } from "next";
import Link from "next/link";
import { DuDuFace, FACE_SPECS, FACE_STATES, colors } from "@dudu/ui";

export const metadata: Metadata = { title: "Brand & faces" };

const swatches = Object.entries(colors);

export default function BrandPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm font-semibold text-orange-dark hover:underline">
        ← Back
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight">DuDu brand</h1>

      <h2 className="mt-8 text-lg font-bold">Colour tokens</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {swatches.map(([name, hex]) => (
          <li key={name} className="rounded-card-sm border border-line bg-surface p-3">
            <div className="h-12 rounded-btn-sm ring-1 ring-line" style={{ background: hex }} />
            <p className="mt-2 text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-text">{hex}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-bold">Face states ({FACE_STATES.length})</h2>
      <ul className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {FACE_STATES.map((s) => (
          <li
            key={s}
            className="flex flex-col items-center gap-2 rounded-card-sm border border-line bg-surface p-3"
          >
            <DuDuFace state={s} size={120} />
            <code className="text-xs font-semibold">{s}</code>
            <span className="text-xs text-muted-text">{FACE_SPECS[s].label}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
