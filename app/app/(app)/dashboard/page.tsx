"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResetButton from "../../components/ResetButton";
import { useSession } from "../../lib/useSession";
import { useLanguage } from "../../lib/i18n";

type StateResponse = {
  deliveryNotes: unknown[];
  notices: unknown[];
  discardedDuplicates: unknown[];
  pendingScan: unknown | null;
  pendingInvoice: unknown | null;
};

export default function Home() {
  const [state, setState] = useState<StateResponse | null>(null);
  const { user } = useSession();
  const { t } = useLanguage();

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then(setState);
  }, []);

  const tiles = [
    {
      label: t.tileDeliveryNotes,
      value: state?.deliveryNotes.length ?? "—",
      color: "info",
    },
    {
      label: t.tilePendingScan,
      value: state?.pendingScan ? 1 : 0,
      color: "attention",
    },
    {
      label: t.tilePendingInvoice,
      value: state?.pendingInvoice ? 1 : 0,
      color: "attention",
    },
    {
      label: t.tileNotices,
      value: state?.notices.length ?? "—",
      color: "danger",
    },
    {
      label: t.tileDuplicates,
      value: state?.discardedDuplicates.length ?? "—",
      color: "neutre",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.welcome}{user ? `, ${user.name}` : ""}</h1>
      <p style={{ color: "var(--color-text-muted)" }}>{t.dashboardIntro}</p>

      <div className="stat-tile-row">
        {tiles.map((tile) => (
          <div key={tile.label} className={`stat-tile stat-tile--${tile.color}`}>
            <div className="stat-tile__value">{tile.value}</div>
            <div className="stat-tile__label">{tile.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/receiving" className="carte-lien">
          <h2 className="font-semibold mb-1">{t.card1Title}</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t.card1Body}
          </p>
        </Link>
        <Link href="/invoices" className="carte-lien">
          <h2 className="font-semibold mb-1">{t.card2Title}</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t.card2Body}
          </p>
        </Link>
        <Link href="/inventory" className="carte-lien">
          <h2 className="font-semibold mb-1">{t.card3Title}</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t.card3Body}
          </p>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ResetButton />
        <Link href="/" className="text-sm" style={{ color: "var(--color-primary)" }}>
          {t.realVsSimulated}
        </Link>
      </div>
    </div>
  );
}
