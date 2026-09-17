"use client";

import { useEffect, useState } from "react";
import ResetButton from "../../components/ResetButton";
import { useSession } from "../../lib/useSession";
import type { DiscrepancyNotice, PendingInvoiceReview } from "../../lib/types";

type StateResponse = {
  notices: DiscrepancyNotice[];
  pendingInvoice: PendingInvoiceReview | null;
};

export default function InvoicesPage() {
  const [state, setState] = useState<StateResponse | null>(null);
  const { user } = useSession();
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
        <h1 className="text-xl font-semibold">Step 4-6: Invoice reconciliation</h1>
        <ResetButton />
      </div>

      <section className="carte space-y-3">
        <h2 className="font-medium">Incoming invoice event</h2>
        <span className="etiquette-statut etiquette-statut--attention">Simulated — no real EDI/accounting feed</span>
        <button className="bouton" onClick={simulateInvoice} disabled={busy || !!pending}>
          {busy ? "Working..." : "Simulate incoming invoice"}
        </button>
        {pending && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            An invoice review is pending below — resolve it before
            simulating another.
          </p>
        )}
      </section>

      {pending && (
        <section className="carte space-y-4">
          <h2 className="font-medium">Reconciliation</h2>
          <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
            {pending.scenario_label}
          </p>

          <div
            className="text-sm grid grid-cols-2 gap-2 sm:grid-cols-4 rounded p-3"
            style={{ background: "var(--color-bg)" }}
          >
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Invoice</div>
              <div className="font-mono">{pending.invoice_id}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>PO / Part</div>
              <div className="font-mono">
                {pending.order_id} / {pending.part}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Invoiced qty</div>
              <div className="font-mono">{pending.invoiced_quantity}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Sum of accepted</div>
              <div className="font-mono">{pending.accepted_total}</div>
            </div>
          </div>

          <div className={`message ${pending.clean ? "message--succes" : "message--erreur"}`}>
            <div className="font-semibold mb-1">
              {pending.clean
                ? "Reconciles cleanly — no discrepancy"
                : `Discrepancy: ${pending.discrepancy > 0 ? "invoice overcharges" : "invoice undercharges"} by ${Math.abs(pending.discrepancy)} unit(s)`}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Evidence, why (by delivery note / receipt)</h3>
            <div className="tableau-conteneur tableau-conteneur--carte">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>DN</th>
                    <th>Receipt</th>
                    <th>Received</th>
                    <th>Damaged</th>
                    <th>Accepted</th>
                    <th>Note</th>
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
                Invoice bills {pending.invoiced_quantity}; delivery notes
                above accepted {pending.accepted_total} in total. Gap of{" "}
                {Math.abs(pending.discrepancy)} unit(s) ={" "}
                {pending.evidence
                  .filter((e) => e.damaged > 0)
                  .map((e) => `${e.damaged} damaged/rejected on ${e.delivery_note}`)
                  .join("; ") || "unexplained by damage, see evidence rows above"}
                , not credited on the invoice.
              </p>
            )}
          </div>

          {error && <p className="text-sm" style={{ color: "var(--color-erreur-text)" }}>{error}</p>}

          <div className="flex items-center gap-3">
            {!pending.clean && (
              <>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Approving as <strong>{user?.name ?? "…"}</strong>.
                </p>
                <button
                  className="bouton bouton--sombre"
                  onClick={approve}
                  disabled={busy}
                >
                  {busy ? "Working..." : "Approve discrepancy notice (simulated)"}
                </button>
              </>
            )}
            <button className="bouton bouton--secondaire" onClick={dismiss} disabled={busy}>
              {pending.clean ? "Acknowledge, no notice needed" : "Dismiss without action"}
            </button>
          </div>
        </section>
      )}

      {state && state.notices.length > 0 && (
        <section className="carte space-y-3">
          <h2 className="font-medium">Generated discrepancy notices</h2>
          <p className="message message--attention text-xs inline-block">
            SIMULATED — displayed only. Nothing is actually sent to a
            supplier or posted to accounting.
          </p>
          {state.notices.map((n) => (
            <div key={n.id} className="carte text-sm space-y-1">
              <div className="font-mono font-medium">{n.id}</div>
              <div>
                Invoice {n.invoice_id} for {n.order_id}/{n.part}: billed{" "}
                {n.invoiced_quantity}, accepted total {n.accepted_total},
                discrepancy {n.discrepancy}.
              </div>
              <div style={{ color: "var(--color-text-muted)" }}>
                Approved by {n.approved_by} at {new Date(n.approved_at).toLocaleString()}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
