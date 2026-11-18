import type { Metadata, Viewport } from "next";
import { Inter, Baloo_2, Noto_Sans_Malayalam, Noto_Sans_Devanagari } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const baloo = Baloo_2({
  subsets: ["latin", "devanagari"],
  variable: "--font-baloo",
  display: "swap",
  weight: ["500", "700", "800"],
});
const malayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-ml",
  display: "swap",
  weight: ["400", "600", "800"],
  preload: false,
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-hi",
  display: "swap",
  weight: ["400", "600", "800"],
  preload: false,
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${baloo.variable} ${malayalam.variable} ${devanagari.variable}`}
    >
      <body className="min-h-dvh">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
