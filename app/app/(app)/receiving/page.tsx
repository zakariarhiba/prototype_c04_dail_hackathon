"use client";

import { useEffect, useState } from "react";
import ResetButton from "../../components/ResetButton";
import { useSession } from "../../lib/useSession";
import type {
  DeliveryNote,
  DiscardedDuplicate,
  PendingScan,
  Receipt,
} from "../../lib/types";

type StateResponse = {
  deliveryNotes: DeliveryNote[];
  receipts: Receipt[];
  discardedDuplicates: DiscardedDuplicate[];
  pendingScan: PendingScan | null;
};

const CLASSIFICATION_STYLE: Record<string, string> = {
  NEW: "etiquette-statut--succes",
  DUPLICATE: "etiquette-statut--attention",
  AMBIGUOUS: "etiquette-statut--danger",
};

export default function ReceivingPage() {
  const [state, setState] = useState<StateResponse | null>(null);
  const [decision, setDecision] = useState<"NEW" | "DUPLICATE" | null>(null);
  const [received, setReceived] = useState<number>(0);
  const [damaged, setDamaged] = useState<number>(0);
  const [accepted, setAccepted] = useState<number>(0);
  const [damageText, setDamageText] = useState("");
  const [damageImage, setDamageImage] = useState<string | null>(null);
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onDamageImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setDamageImage(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDamageImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function refresh() {
    const res = await fetch("/api/state");
    const data = await res.json();
    setState(data);
    if (data.pendingScan) {
      setDecision(data.pendingScan.system_classification === "AMBIGUOUS" ? null : data.pendingScan.system_classification);
      setReceived(data.pendingScan.listed_quantity);
      setDamaged(0);
      setAccepted(data.pendingScan.listed_quantity);
      setDamageText("");
      setDamageImage(null);
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
    const res = await fetch("/api/simulate-scan", { method: "POST" });
    const data = await res.json();
    if (!data.ok) setError(data.error);
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
        damage_evidence_text: damageText,
        damage_evidence_image: damageImage,
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
    <div className="space-y-8">
      <div className="entete-page">
        <h1 className="text-xl font-semibold">Step 1-3: Receiving</h1>
        <ResetButton />
      </div>

      <section className="carte space-y-3">
        <h2 className="font-medium">Incoming delivery note event</h2>
        <span className="etiquette-statut etiquette-statut--attention">Simulated — no real scanner</span>
        <button className="bouton" onClick={simulateScan} disabled={busy || !!pending}>
          {busy ? "Working..." : "Simulate incoming delivery note"}
        </button>
        {pending && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            A scan is pending parts receiving lead confirmation below — resolve it before
            simulating another.
          </p>
        )}
      </section>

      {pending && (
        <section className="carte space-y-4">
          <h2 className="font-medium">System check against open POs</h2>
          <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
            {pending.scenario_label}
          </p>

          <div
            className="text-sm grid grid-cols-2 gap-2 sm:grid-cols-4 rounded p-3"
            style={{ background: "var(--color-bg)" }}
          >
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Scan ID</div>
              <div className="font-mono">{pending.scan_id}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>PO</div>
              <div className="font-mono">{pending.order_id}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Part</div>
              <div className="font-mono">{pending.part}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Listed qty</div>
              <div className="font-mono">{pending.listed_quantity}</div>
            </div>
          </div>

          <div className={`message ${CLASSIFICATION_STYLE[pending.system_classification]}`}>
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
            <h3 className="font-medium text-sm">Parts receiving lead confirmation (required before anything is saved)</h3>

            <div className="champ">
              <label>Confirm or correct the flag:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDecision("NEW")}
                  className={decision === "NEW" ? "bouton" : "bouton bouton--secondaire"}
                >
                  New delivery
                </button>
                <button
                  onClick={() => setDecision("DUPLICATE")}
                  className={decision === "DUPLICATE" ? "bouton" : "bouton bouton--secondaire"}
                >
                  Duplicate scan (discard)
                </button>
              </div>
            </div>

            {decision === "NEW" && (
              <div className="champ-groupe max-w-md">
                <div className="champ">
                  <label>Received</label>
                  <input
                    type="number"
                    value={received}
                    onChange={(e) => setReceived(Number(e.target.value))}
                  />
                </div>
                <div className="champ">
                  <label>Damaged</label>
                  <input
                    type="number"
                    value={damaged}
                    onChange={(e) => setDamaged(Number(e.target.value))}
                  />
                </div>
                <div className="champ">
                  <label>Accepted</label>
                  <input
                    type="number"
                    value={accepted}
                    onChange={(e) => setAccepted(Number(e.target.value))}
                  />
                </div>
                {damaged > 0 && (
                  <>
                    <div className="champ">
                      <label>Damage description</label>
                      <input
                        value={damageText}
                        onChange={(e) => setDamageText(e.target.value)}
                        placeholder="what's damaged, how"
                      />
                    </div>
                    <div className="champ">
                      <label>Damage photo (optional if description given)</label>
                      <input type="file" accept="image/*" onChange={onDamageImageChange} />
                      <span className="etiquette-statut etiquette-statut--attention">
                        Simulated — photo never leaves this prototype
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {decision === "DUPLICATE" && (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Confirming this as a duplicate discards the scan — no new
                delivery note or receipt is created. The discard itself is
                logged for audit.
              </p>
            )}

            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Confirming as <strong>{user?.name ?? "…"}</strong>.
            </p>

            {error && <p className="text-sm" style={{ color: "var(--color-erreur-text)" }}>{error}</p>}

            <button
              className="bouton bouton--sombre"
              onClick={submitConfirmation}
              disabled={busy || !decision}
            >
              {busy ? "Saving..." : "Confirm"}
            </button>
          </div>
        </section>
      )}

      <section className="carte space-y-4">
        <h2 className="font-medium">Current state</h2>

        <div>
          <h3 className="text-sm font-medium mb-2">Delivery notes logged</h3>
          <div className="tableau-conteneur tableau-conteneur--carte">
            <table className="tableau">
              <thead>
                <tr>
                  <th>DN</th>
                  <th>PO</th>
                  <th>Part</th>
                  <th>Listed qty</th>
                  <th>Received / Damaged / Accepted</th>
                  <th>Damage evidence</th>
                  <th>Logged via</th>
                </tr>
              </thead>
              <tbody>
                {state?.deliveryNotes.map((dn) => {
                  const r = state.receipts.find((r) => r.delivery_note === dn.id);
                  return (
                    <tr key={dn.id}>
                      <td className="font-mono">{dn.id}</td>
                      <td className="font-mono">{dn.order_id}</td>
                      <td>{dn.part}</td>
                      <td>{dn.listed_quantity}</td>
                      <td>{r ? `${r.received} / ${r.damaged} / ${r.accepted}` : "(no receipt)"}</td>
                      <td style={{ color: "var(--color-text-muted)" }}>
                        {r?.damage_evidence_text ?? (r?.damage_evidence_image ? "(photo only)" : "-")}
                        {r?.damage_evidence_image && (
                          // eslint-disable-next-line @next/next/no-img-element -- stored data URL, not a static asset
                          <img
                            src={r.damage_evidence_image}
                            alt="Damage evidence"
                            width={40}
                            height={40}
                            style={{ display: "inline-block", marginLeft: 6, verticalAlign: "middle", borderRadius: 4 }}
                          />
                        )}
                      </td>
                      <td style={{ color: "var(--color-text-muted)" }}>{dn.logged_via}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {state && state.discardedDuplicates.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Discarded duplicate scans (audit log)</h3>
            <div className="tableau-conteneur tableau-conteneur--carte">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Scan</th>
                    <th>PO / Part</th>
                    <th>Matched DN</th>
                    <th>Confirmed at</th>
                  </tr>
                </thead>
                <tbody>
                  {state.discardedDuplicates.map((d) => (
                    <tr key={d.scan_id}>
                      <td className="font-mono">{d.scan_id}</td>
                      <td>
                        {d.order_id} / {d.part}
                      </td>
                      <td className="font-mono">{d.matched_delivery_note ?? "-"}</td>
                      <td style={{ color: "var(--color-text-muted)" }}>
                        {new Date(d.confirmed_by_clerk_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
