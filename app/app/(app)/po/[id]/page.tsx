"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ResetButton from "../../../components/ResetButton";
import { useLanguage } from "../../../lib/i18n";
import type { PoTimeline } from "../../../lib/types";

const STATUS_STYLE: Record<string, string> = {
  open: "etiquette-statut--attention",
  in_process: "etiquette-statut--attention",
  delivered: "etiquette-statut--succes",
  closed: "etiquette-statut--succes",
};

export default function PoDetailPage() {
  const params = useParams<{ id: string }>();
  const [timeline, setTimeline] = useState<PoTimeline | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      const res = await fetch(`/api/po/${params.id}`);
      const data = await res.json();
      if (data.ok) setTimeline(data.timeline);
      else setError(data.error);
    })();
  }, [params.id]);

  return (
    <div className="space-y-8">
      <div className="entete-page">
        <h1 className="text-xl font-semibold">
          {t.po} {params.id} <Link href="/po" className="lien-secondaire text-sm">&larr; {t.allPos}</Link>
        </h1>
        <ResetButton />
      </div>

      {error && <p className="text-sm" style={{ color: "var(--color-erreur-text)" }}>{error}</p>}

      {timeline && (
        <section className="carte space-y-4">
          <div
            className="text-sm grid grid-cols-2 gap-2 sm:grid-cols-4 rounded p-3"
            style={{ background: "var(--color-bg)" }}
          >
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.part}</div>
              <div className="font-mono">{timeline.order.part}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.colOrdered}</div>
              <div className="font-mono">{timeline.order.quantity}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.colAcceptedSoFar}</div>
              <div className="font-mono">{timeline.accepted_total}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.colStatus}</div>
              <span className={`etiquette-statut ${STATUS_STYLE[timeline.status]}`}>{STATUS_LABEL[timeline.status] ?? timeline.status}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">{t.timelineTitle}</h3>
            <ol className="space-y-2">
              {timeline.events.map((e, i) => (
                <li key={i} className="text-sm border-l-2 pl-3" style={{ borderColor: "var(--color-border)" }}>
                  <div style={{ color: "var(--color-text-muted)" }}>{new Date(e.at).toLocaleString()}</div>
                  <div>{e.label}</div>
                </li>
              ))}
              {timeline.events.length === 0 && (
                <li className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {t.nothingLoggedYet}
                </li>
              )}
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}
