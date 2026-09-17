"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResetButton from "../../components/ResetButton";
import type { PoTimeline } from "../../lib/types";

const STATUS_STYLE: Record<string, string> = {
  open: "etiquette-statut--attention",
  in_process: "etiquette-statut--attention",
  delivered: "etiquette-statut--succes",
  closed: "etiquette-statut--succes",
};

export default function PoTrackerPage() {
  const [timelines, setTimelines] = useState<PoTimeline[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    (async () => {
      const res = await fetch("/api/po");
      const data = await res.json();
      if (data.ok) setTimelines(data.timelines);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div className="entete-page">
        <h1 className="text-xl font-semibold">PO tracker</h1>
        <ResetButton />
      </div>

      <section className="carte space-y-3">
        <h2 className="font-medium">Every PO, from creation until fully resolved</h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Status computed live from delivery notes, receipts and approved
          discrepancy notices — never a separate flag to keep in sync. A PO
          stays open/in-process indefinitely if never fully resolved.
        </p>
        <div className="tableau-conteneur tableau-conteneur--carte">
          <table className="tableau">
            <thead>
              <tr>
                <th>PO</th>
                <th>Part</th>
                <th>Ordered</th>
                <th>Accepted so far</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {timelines?.map((t) => (
                <tr key={t.order.id}>
                  <td className="font-mono">
                    <Link href={`/po/${t.order.id}`} className="lien-secondaire">
                      {t.order.id}
                    </Link>
                  </td>
                  <td>{t.order.part}</td>
                  <td>{t.order.quantity}</td>
                  <td>{t.accepted_total}</td>
                  <td>
                    <span className={`etiquette-statut ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
              {timelines?.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--color-text-muted)" }}>
                    No POs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
