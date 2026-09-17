"use client";

import { useEffect, useState } from "react";
import ResetButton from "../../components/ResetButton";
import { useSession } from "../../lib/useSession";
import { useLanguage } from "../../lib/i18n";
import type { DiscrepancyNotice, PendingInvoiceReview } from "../../lib/types";

type StateResponse = {
  notices: DiscrepancyNotice[];
  pendingInvoice: PendingInvoiceReview | null;
};

export default function InvoicesPage() {
  const [state, setState] = useState<StateResponse | null>(null);
  const { user } = useSession();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/state");
    const data = await res.json();
    setState(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh();
  }, []);

  async function simulateInvoice() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/simulate-invoice", { method: "POST" });
    const data = await res.json();
    if (!data.ok) setError(data.error);
    await refresh();
    setBusy(false);
  }

  async function approve() {
    if (!state?.pendingInvoice) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/approve-notice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: state.pendingInvoice.invoice_id,
      }),
    });
    const data = await res.json();
    if (!data.ok) setError(data.error);
    await refresh();
    setBusy(false);
  }

  async function dismiss() {
    setBusy(true);
    await fetch("/api/dismiss-invoice", { method: "POST" });
    await refresh();
    setBusy(false);
  }

  const pending = state?.pendingInvoice ?? null;

  return (
    <div className="space-y-8">
      <div className="entete-page">
        <h1 className="text-xl font-semibold">{t.invoicesTitle}</h1>
        <ResetButton />
      </div>

      <section className="carte space-y-3">
        <h2 className="font-medium">{t.incomingInvoiceEvent}</h2>
        <span className="etiquette-statut etiquette-statut--attention">{t.simulatedNoEdi}</span>
        <button className="bouton" onClick={simulateInvoice} disabled={busy || !!pending}>
          {busy ? t.working : t.simulateInvoiceBtn}
        </button>
        {pending && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {t.pendingInvoiceNote}
          </p>
        )}
      </section>

      {pending && (
        <section className="carte space-y-4">
          <h2 className="font-medium">{t.reconciliationTitle}</h2>
          <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
            {pending.scenario_label}
          </p>

          <div
            className="text-sm grid grid-cols-2 gap-2 sm:grid-cols-4 rounded p-3"
            style={{ background: "var(--color-bg)" }}
          >
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.invoice}</div>
              <div className="font-mono">{pending.invoice_id}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.poPart}</div>
              <div className="font-mono">
                {pending.order_id} / {pending.part}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.invoicedQty}</div>
              <div className="font-mono">{pending.invoiced_quantity}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.sumAccepted}</div>
              <div className="font-mono">{pending.accepted_total}</div>
            </div>
          </div>

          <div className={`message ${pending.clean ? "message--succes" : "message--erreur"}`}>
            <div className="font-semibold mb-1">
              {pending.clean
                ? t.reconcilesClean
                : `${pending.discrepancy > 0 ? t.discrepancyOver : t.discrepancyUnder} ${Math.abs(pending.discrepancy)} unit(s)`}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">{t.evidenceTitle}</h3>
            <div className="tableau-conteneur tableau-conteneur--carte">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>{t.colDn}</th>
                    <th>{t.colReceipt}</th>
                    <th>{t.colReceived}</th>
                    <th>{t.colDamaged}</th>
                    <th>{t.colAccepted}</th>
                    <th>{t.colNote}</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.evidence.map((e) => (
                    <tr key={e.delivery_note}>
                      <td className="font-mono">{e.delivery_note}</td>
                      <td className="font-mono">{e.receipt}</td>
                      <td>{e.received}</td>
                      <td>{e.damaged}</td>
                      <td>{e.accepted}</td>
                      <td>{e.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!pending.clean && (
              <p className="text-sm mt-2">
                {t.gapExplain1} {pending.invoiced_quantity}{t.gapExplain2} {pending.accepted_total}.{" "}
                {Math.abs(pending.discrepancy)} unit(s) ={" "}
                {pending.evidence
                  .filter((e) => e.damaged > 0)
                  .map((e) => `${e.damaged} ${t.damagedRejectedOn} ${e.delivery_note}`)
                  .join("; ") || t.unexplainedByDamage}
                .
              </p>
            )}
          </div>

          {error && <p className="text-sm" style={{ color: "var(--color-erreur-text)" }}>{error}</p>}

          <div className="flex items-center gap-3">
            {!pending.clean && (
              <>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {t.approvingAs} <strong>{user?.name ?? "…"}</strong>.
                </p>
                <button
                  className="bouton bouton--sombre"
                  onClick={approve}
                  disabled={busy}
                >
                  {busy ? t.working : t.approveNoticeBtn}
                </button>
              </>
            )}
            <button className="bouton bouton--secondaire" onClick={dismiss} disabled={busy}>
              {pending.clean ? t.acknowledgeNoNotice : t.dismissWithoutAction}
            </button>
          </div>
        </section>
      )}

      {state && state.notices.length > 0 && (
        <section className="carte space-y-3">
          <h2 className="font-medium">{t.generatedNoticesTitle}</h2>
          <p className="message message--attention text-xs inline-block">
            {t.simulatedNoticeWarning}
          </p>
          {state.notices.map((n) => (
            <div key={n.id} className="carte text-sm space-y-1">
              <div className="font-mono font-medium">{n.id}</div>
              <div>
                {t.invoiceFor} {n.invoice_id} {t.billed} {n.order_id}/{n.part}: {t.acceptedTotal}{" "}
                {n.invoiced_quantity}, {t.discrepancyLabel} {n.accepted_total},{" "}
                {t.discrepancyLabelSuffix} {n.discrepancy}.
              </div>
              <div style={{ color: "var(--color-text-muted)" }}>
                {t.approvedBy} {n.approved_by} {new Date(n.approved_at).toLocaleString()}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
