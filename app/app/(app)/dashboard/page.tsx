"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResetButton from "../../components/ResetButton";
import { useSession } from "../../lib/useSession";

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

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then(setState);
  }, []);

  const tiles = [
    {
      label: "Delivery notes logged",
      value: state?.deliveryNotes.length ?? "—",
      color: "info",
    },
    {
      label: "Pending scan awaiting confirmation",
      value: state?.pendingScan ? 1 : 0,
      color: "attention",
    },
    {
      label: "Pending invoice awaiting review",
      value: state?.pendingInvoice ? 1 : 0,
      color: "attention",
    },
    {
      label: "Discrepancy notices generated",
      value: state?.notices.length ?? "—",
      color: "danger",
    },
    {
      label: "Duplicate scans discarded",
      value: state?.discardedDuplicates.length ?? "—",
      color: "neutre",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome{user ? `, ${user.name}` : ""}</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        Case C04. The client&apos;s pain: at the loading bay they record what
        arrived; later someone reconciles the invoice and cannot tell whether
        a difference is a shortage, a damaged item, a duplicate scan, or a
        second delivery. This prototype demonstrates a narrow slice of that
        workflow end-to-end, with a human confirming every write.
      </p>

      <div className="stat-tile-row">
        {tiles.map((t) => (
          <div key={t.label} className={`stat-tile stat-tile--${t.color}`}>
            <div className="stat-tile__value">{t.value}</div>
            <div className="stat-tile__label">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/receiving" className="carte-lien">
          <h2 className="font-semibold mb-1">1. Receiving</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Simulate an incoming delivery-note scan, see the system&apos;s
            new-vs-duplicate flag with its reasoning, then confirm or correct
            it as the parts receiving lead.
          </p>
        </Link>
        <Link href="/invoices" className="carte-lien">
          <h2 className="font-semibold mb-1">2. Invoice reconciliation</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Simulate an incoming invoice, reconcile it against the sum of
            accepted quantities across linked delivery notes, review the
            evidence, and approve (or not) a simulated discrepancy notice.
          </p>
        </Link>
        <Link href="/inventory" className="carte-lien">
          <h2 className="font-semibold mb-1">3. Inventory</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            See received-to-date by part, summed live from accepted
            receipts, and add new stock as the parts receiving lead.
          </p>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ResetButton />
        <Link href="/" className="text-sm" style={{ color: "var(--color-primary)" }}>
          What&apos;s real vs. simulated in this prototype →
        </Link>
      </div>
    </div>
  );
}
