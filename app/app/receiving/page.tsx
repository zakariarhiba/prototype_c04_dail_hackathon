"use client";

import { useEffect, useState } from "react";
import ResetButton from "../components/ResetButton";
import type {
  DeliveryNote,
  DiscardedDuplicate,
  PendingScan,
  Receipt,
} from "../lib/types";

type StateResponse = {
  deliveryNotes: DeliveryNote[];
  receipts: Receipt[];
  discardedDuplicates: DiscardedDuplicate[];
  pendingScan: PendingScan | null;
};

const CLASSIFICATION_STYLE: Record<string, string> = {
  NEW: "bg-green-100 text-green-800 border-green-300",
  DUPLICATE: "bg-orange-100 text-orange-800 border-orange-300",
  AMBIGUOUS: "bg-red-100 text-red-800 border-red-300",
};

export default function ReceivingPage() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [decision, setDecision] = useState<"NEW" | "DUPLICATE" | null>(null);
  const [received, setReceived] = useState<number>(0);
  const [damaged, setDamaged] = useState<number>(0);
  const [accepted, setAccepted] = useState<number>(0);
  const [clerkName, setClerkName] = useState("Clerk on duty");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/state");
    const data = await res.json();
    setState(data);
    if (data.pendingScan) {
      setDecision(data.pendingScan.system_classification === "AMBIGUOUS" ? null : data.pendingScan.system_classification);
      setReceived(data.pendingScan.listed_quantity);
      setDamaged(0);
      setAccepted(data.pendingScan.listed_quantity);
    } else {
      setDecision(null);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh();
  }, []);

  async function simulateScan() {
    setBusy(true);
    setError(null);
    await fetch("/api/simulate-scan", { method: "POST" });
    await refresh();
    setBusy(false);
  }

  async function submitConfirmation() {
    if (!state?.pendingScan || !decision) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/confirm-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scan_id: state.pendingScan.scan_id,
        decision,
        received,
        damaged,
        accepted,
        clerk_name: clerkName,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
    }
    await refresh();
    setBusy(false);
  }

  const pending = state?.pendingScan ?? null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Step 1-3: Receiving</h1>
        <ResetButton />
      </div>

      <section className="border border-neutral-200 rounded-lg p-5 bg-white space-y-3">
        <h2 className="font-medium">Incoming delivery note event</h2>
        <p className="text-sm text-neutral-600">
          This button is a labeled simulation: there is no real scanner
          wired up. Each click advances through a fixed rotation of three
          scenarios (ordinary new delivery, likely duplicate, and a
          genuinely ambiguous case) so the demo reliably shows all three
          paths. The system&apos;s classification of whichever scenario
          comes up <em>is</em> computed live from current state, not
          scripted per scenario.
        </p>
        <button
          onClick={simulateScan}
          disabled={busy || !!pending}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Working..." : "Simulate incoming delivery note"}
        </button>
        {pending && (
          <p className="text-xs text-neutral-500">
            A scan is pending clerk confirmation below — resolve it before
            simulating another.
          </p>
        )}
      </section>

      {pending && (
        <section className="border border-neutral-200 rounded-lg p-5 bg-white space-y-4">
          <h2 className="font-medium">System check against open POs</h2>
          <p className="text-xs text-neutral-500 italic">{pending.scenario_label}</p>

          <div className="text-sm grid grid-cols-2 gap-2 sm:grid-cols-4 bg-neutral-50 rounded p-3">
            <div>
              <div className="text-neutral-500">Scan ID</div>
              <div className="font-mono">{pending.scan_id}</div>
            </div>
            <div>
              <div className="text-neutral-500">PO</div>
              <div className="font-mono">{pending.order_id}</div>
            </div>
            <div>
              <div className="text-neutral-500">Part</div>
              <div className="font-mono">{pending.part}</div>
            </div>
            <div>
              <div className="text-neutral-500">Listed qty</div>
              <div className="font-mono">{pending.listed_quantity}</div>
            </div>
          </div>

          <div
            className={`border rounded p-3 text-sm ${CLASSIFICATION_STYLE[pending.system_classification]}`}
          >
            <div className="font-semibold mb-1">
              System flag: {pending.system_classification}
              {pending.system_confidence === "low" && " (low confidence)"}
            </div>
            <div>{pending.system_reasoning}</div>
            {pending.system_classification === "AMBIGUOUS" && (
              <div className="mt-2 font-medium">
                The system will not guess here — a human must decide new vs.
                duplicate below.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Clerk confirmation (required before anything is saved)</h3>

            <div>
              <label className="text-sm text-neutral-600 block mb-1">
                Confirm or correct the flag:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDecision("NEW")}
                  className={`px-3 py-1.5 rounded border text-sm ${
                    decision === "NEW"
                      ? "bg-green-600 text-white border-green-600"
                      : "border-neutral-300"
                  }`}
                >
                  New delivery
                </button>
                <button
                  onClick={() => setDecision("DUPLICATE")}
                  className={`px-3 py-1.5 rounded border text-sm ${
                    decision === "DUPLICATE"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "border-neutral-300"
                  }`}
                >
                  Duplicate scan (discard)
                </button>
              </div>
            </div>

            {decision === "NEW" && (
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <label className="text-sm">
                  Received
                  <input
                    type="number"
                    className="mt-1 w-full border border-neutral-300 rounded px-2 py-1"
                    value={received}
                    onChange={(e) => setReceived(Number(e.target.value))}
                  />
                </label>
                <label className="text-sm">
                  Damaged
                  <input
                    type="number"
                    className="mt-1 w-full border border-neutral-300 rounded px-2 py-1"
                    value={damaged}
                    onChange={(e) => setDamaged(Number(e.target.value))}
                  />
                </label>
                <label className="text-sm">
                  Accepted
                  <input
                    type="number"
                    className="mt-1 w-full border border-neutral-300 rounded px-2 py-1"
                    value={accepted}
                    onChange={(e) => setAccepted(Number(e.target.value))}
                  />
                </label>
              </div>
            )}

            {decision === "DUPLICATE" && (
              <p className="text-sm text-neutral-600">
                Confirming this as a duplicate discards the scan — no new
                delivery note or receipt is created. The discard itself is
                logged for audit.
              </p>
            )}

            <label className="text-sm block max-w-xs">
              Clerk name
              <input
                className="mt-1 w-full border border-neutral-300 rounded px-2 py-1"
                value={clerkName}
                onChange={(e) => setClerkName(e.target.value)}
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={submitConfirmation}
              disabled={busy || !decision}
              className="px-4 py-2 rounded bg-neutral-900 text-white text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Saving..." : "Confirm"}
            </button>
          </div>
        </section>
      )}

      <section className="border border-neutral-200 rounded-lg p-5 bg-white space-y-4">
        <h2 className="font-medium">Current state</h2>

        <div>
          <h3 className="text-sm font-medium mb-2">Delivery notes logged</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="py-1 pr-4">DN</th>
                <th className="py-1 pr-4">PO</th>
                <th className="py-1 pr-4">Part</th>
                <th className="py-1 pr-4">Listed qty</th>
                <th className="py-1 pr-4">Received / Damaged / Accepted</th>
                <th className="py-1 pr-4">Logged via</th>
              </tr>
            </thead>
            <tbody>
              {state?.deliveryNotes.map((dn) => {
                const r = state.receipts.find((r) => r.delivery_note === dn.id);
                return (
                  <tr key={dn.id} className="border-b border-neutral-100">
                    <td className="py-1 pr-4 font-mono">{dn.id}</td>
                    <td className="py-1 pr-4 font-mono">{dn.order_id}</td>
                    <td className="py-1 pr-4">{dn.part}</td>
                    <td className="py-1 pr-4">{dn.listed_quantity}</td>
                    <td className="py-1 pr-4">
                      {r ? `${r.received} / ${r.damaged} / ${r.accepted}` : "(no receipt)"}
                    </td>
                    <td className="py-1 pr-4 text-neutral-500">{dn.logged_via}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {state && state.discardedDuplicates.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Discarded duplicate scans (audit log)</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="py-1 pr-4">Scan</th>
                  <th className="py-1 pr-4">PO / Part</th>
                  <th className="py-1 pr-4">Matched DN</th>
                  <th className="py-1 pr-4">Confirmed at</th>
                </tr>
              </thead>
              <tbody>
                {state.discardedDuplicates.map((d) => (
                  <tr key={d.scan_id} className="border-b border-neutral-100">
                    <td className="py-1 pr-4 font-mono">{d.scan_id}</td>
                    <td className="py-1 pr-4">
                      {d.order_id} / {d.part}
                    </td>
                    <td className="py-1 pr-4 font-mono">{d.matched_delivery_note ?? "-"}</td>
                    <td className="py-1 pr-4 text-neutral-500">
                      {new Date(d.confirmed_by_clerk_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
