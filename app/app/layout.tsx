import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "C04 — Delivery Reconciliation Prototype",
  description: "Delivery note vs invoice reconciliation prototype (synthetic exercise data)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white px-6 py-3 flex items-center justify-between">
          <div>
            <span className="font-semibold">C04 Prototype</span>
            <span className="ml-2 text-sm text-neutral-500">
              Delivery note vs. invoice reconciliation — SYNTHETIC DATA
            </span>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="text-blue-700 hover:underline">
              Home
            </Link>
            <Link href="/receiving" className="text-blue-700 hover:underline">
              1. Receiving
            </Link>
            <Link href="/invoices" className="text-blue-700 hover:underline">
              2. Invoice reconciliation
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
