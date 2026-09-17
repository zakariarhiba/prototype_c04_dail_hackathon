"use client";

import { useEffect, useState } from "react";
import ResetButton from "../components/ResetButton";
import type { DiscrepancyNotice, PendingInvoiceReview } from "../lib/types";

type StateResponse = {
  notices: DiscrepancyNotice[];
  pendingInvoice: PendingInvoiceReview | null;
};

export default function InvoicesPage() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [approverName, setApproverName] = useState("Accounting clerk on duty");
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
    await fetch("/api/simulate-invoice", { method: "POST" });
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
        approved_by: approverName,
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
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Step 4-6: Invoice reconciliation</h1>
        <ResetButton />
      </div>

      <section className="border border-neutral-200 rounded-lg p-5 bg-white space-y-3">
        <h2 className="font-medium">Incoming invoice event</h2>
        <p className="text-sm text-neutral-600">
          Labeled simulation: no real EDI/accounting feed is wired up. Each
          click alternates between an invoice that overcharges (ignores a
          rejected damaged unit) and one that already bills correctly, so
          both the mismatch and clean paths are demonstrable. The
          reconciliation math itself — summing <strong>accepted</strong>{" "}
          (not received) quantities across every delivery note logged for
          the PO, and diffing against the invoiced quantity — is computed
          live from current state.
        </p>
        <button
          onClick={simulateInvoice}
          disabled={busy || !!pending}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Working..." : "Simulate incoming invoice"}
        </button>
        {pending && (
          <p className="text-xs text-neutral-500">
            An invoice review is pending below — resolve it before
            simulating another.
          </p>
        )}
      </section>

      {pending && (
        <section className="border border-neutral-200 rounded-lg p-5 bg-white space-y-4">
          <h2 className="font-medium">Reconciliation</h2>
          <p className="text-xs text-neutral-500 italic">{pending.scenario_label}</p>

          <div className="text-sm grid grid-cols-2 gap-2 sm:grid-cols-4 bg-neutral-50 rounded p-3">
            <div>
              <div className="text-neutral-500">Invoice</div>
              <div className="font-mono">{pending.invoice_id}</div>
            </div>
            <div>
              <div className="text-neutral-500">PO / Part</div>
              <div className="font-mono">
                {pending.order_id} / {pending.part}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Invoiced qty</div>
              <div className="font-mono">{pending.invoiced_quantity}</div>
            </div>
            <div>
              <div className="text-neutral-500">Sum of accepted</div>
              <div className="font-mono">{pending.accepted_total}</div>
            </div>
          </div>

          <div
            className={`border rounded p-3 text-sm ${
              pending.clean
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300"
            }`}
          >
            <div className="font-semibold mb-1">
              {pending.clean
                ? "Reconciles cleanly — no discrepancy"
                : `Discrepancy: ${pending.discrepancy > 0 ? "invoice overcharges" : "invoice undercharges"} by ${Math.abs(pending.discrepancy)} unit(s)`}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Evidence — why (by delivery note / receipt)</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="py-1 pr-4">DN</th>
                  <th className="py-1 pr-4">Receipt</th>
                  <th className="py-1 pr-4">Received</th>
                  <th className="py-1 pr-4">Damaged</th>
                  <th className="py-1 pr-4">Accepted</th>
                  <th className="py-1 pr-4">Note</th>
                </tr>
              </thead>
              <tbody>
                {pending.evidence.map((e) => (
                  <tr key={e.delivery_note} className="border-b border-neutral-100">
                    <td className="py-1 pr-4 font-mono">{e.delivery_note}</td>
                    <td className="py-1 pr-4 font-mono">{e.receipt}</td>
                    <td className="py-1 pr-4">{e.received}</td>
                    <td className="py-1 pr-4">{e.damaged}</td>
                    <td className="py-1 pr-4">{e.accepted}</td>
                    <td className="py-1 pr-4">{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pending.clean && (
              <p className="text-sm text-neutral-700 mt-2">
                Invoice bills {pending.invoiced_quantity}; delivery notes
                above accepted {pending.accepted_total} in total. Gap of{" "}
                {Math.abs(pending.discrepancy)} unit(s) ={" "}
                {pending.evidence
                  .filter((e) => e.damaged > 0)
                  .map((e) => `${e.damaged} damaged/rejected on ${e.delivery_note}`)
                  .join("; ") || "unexplained by damage — see evidence rows above"}
                , not credited on the invoice.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            {!pending.clean && (
              <>
                <label className="text-sm">
                  Approver
                  <input
                    className="ml-2 border border-neutral-300 rounded px-2 py-1"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                  />
                </label>
                <button
                  onClick={approve}
                  disabled={busy}
                  className="px-4 py-2 rounded bg-neutral-900 text-white text-sm font-medium disabled:opacity-50"
                >
                  {busy ? "Working..." : "Approve discrepancy notice (simulated)"}
                </button>
              </>
            )}
            <button
              onClick={dismiss}
              disabled={busy}
              className="px-3 py-1.5 rounded border border-neutral-300 text-sm disabled:opacity-50"
            >
              {pending.clean ? "Acknowledge, no notice needed" : "Dismiss without action"}
            </button>
          </div>
        </section>
      )}

      {state && state.notices.length > 0 && (
        <section className="border border-neutral-200 rounded-lg p-5 bg-white space-y-3">
          <h2 className="font-medium">Generated discrepancy notices</h2>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 inline-block">
            SIMULATED — displayed only. Nothing is actually sent to a
            supplier or posted to accounting.
          </p>
          {state.notices.map((n) => (
            <div key={n.id} className="border border-neutral-200 rounded p-3 text-sm space-y-1">
              <div className="font-mono font-medium">{n.id}</div>
              <div>
                Invoice {n.invoice_id} for {n.order_id}/{n.part}: billed{" "}
                {n.invoiced_quantity}, accepted total {n.accepted_total},
                discrepancy {n.discrepancy}.
              </div>
              <div className="text-neutral-500">
                Approved by {n.approved_by} at {new Date(n.approved_at).toLocaleString()}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
