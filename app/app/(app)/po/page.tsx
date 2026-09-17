"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResetButton from "../../components/ResetButton";
import { useLanguage } from "../../lib/i18n";
import type { PoTimeline } from "../../lib/types";

const STATUS_STYLE: Record<string, string> = {
  open: "etiquette-statut--attention",
  in_process: "etiquette-statut--attention",
  delivered: "etiquette-statut--succes",
  closed: "etiquette-statut--succes",
};

export default function PoTrackerPage() {
  const [timelines, setTimelines] = useState<PoTimeline[] | null>(null);
  const { t } = useLanguage();

  const STATUS_LABEL: Record<string, string> = {
    open: t.statusOpen,
    in_process: t.statusInProcess,
    delivered: t.statusDelivered,
    closed: t.statusClosed,
  };

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
        <h1 className="text-xl font-semibold">{t.poTrackerTitle}</h1>
        <ResetButton />
      </div>

      <section className="carte space-y-3">
        <h2 className="font-medium">{t.everyPoTitle}</h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {t.poStatusNote}
        </p>
        <div className="tableau-conteneur tableau-conteneur--carte">
          <table className="tableau">
            <thead>
              <tr>
                <th>{t.po}</th>
                <th>{t.part}</th>
                <th>{t.colOrdered}</th>
                <th>{t.colAcceptedSoFar}</th>
                <th>{t.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {timelines?.map((tl) => (
                <tr key={tl.order.id}>
                  <td className="font-mono">
                    <Link href={`/po/${tl.order.id}`} className="lien-secondaire">
                      {tl.order.id}
                    </Link>
                  </td>
                  <td>{tl.order.part}</td>
                  <td>{tl.order.quantity}</td>
                  <td>{tl.accepted_total}</td>
                  <td>
                    <span className={`etiquette-statut ${STATUS_STYLE[tl.status]}`}>{STATUS_LABEL[tl.status] ?? tl.status}</span>
                  </td>
                </tr>
              ))}
              {timelines?.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--color-text-muted)" }}>
                    {t.noPosYet}
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
