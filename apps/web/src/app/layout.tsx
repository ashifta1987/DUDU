import type { Metadata, Viewport } from "next";
import { Inter, Baloo_2 } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  display: "swap",
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "DuDu™ – Your AI Buddy", template: "%s · DuDu" },
  description:
    "DuDu is an AI desk companion for children in CBSE Class 1–10. Homework help, quizzes, stories and a calm study routine — with parents in control.",
  icons: { icon: "/brand/dudu-logo.png", apple: "/brand/dudu-logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#F26B1D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${baloo.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
