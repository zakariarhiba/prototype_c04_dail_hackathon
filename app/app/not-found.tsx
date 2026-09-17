"use client";

import Link from "next/link";
import { useLanguage } from "./lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 className="text-2xl font-semibold">404 — {t.notFoundTitle}</h1>
      <p style={{ color: "var(--color-text-muted)" }}>{t.notFoundBody}</p>
      <Link href="/dashboard" className="bouton">
        {t.backToDashboard}
      </Link>
    </div>
  );
}
