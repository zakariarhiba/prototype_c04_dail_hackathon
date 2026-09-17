import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LoadingIntro from "./components/LoadingIntro";
import RouteProgressBar from "./components/RouteProgressBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "trast — Case C04 Delivery Reconciliation Prototype",
  description: "Delivery note vs invoice reconciliation prototype (synthetic exercise data)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <LoadingIntro />
        <RouteProgressBar />
        {children}
      </body>
    </html>
  );
}
