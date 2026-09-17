"use client";

import { useEffect, useState } from "react";
import ResetButton from "../../components/ResetButton";
import { useSession } from "../../lib/useSession";
import { useLanguage } from "../../lib/i18n";
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
  const { t } = useLanguage();
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
        <h1 className="text-xl font-semibold">{t.receivingTitle}</h1>
        <ResetButton />
      </div>

      <section className="carte space-y-3">
        <h2 className="font-medium">{t.incomingScanEvent}</h2>
        <span className="etiquette-statut etiquette-statut--attention">{t.simulatedNoScanner}</span>
        <button className="bouton" onClick={simulateScan} disabled={busy || !!pending}>
          {busy ? t.working : t.simulateScanBtn}
        </button>
        {pending && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {t.pendingScanNote}
          </p>
        )}
      </section>

      {pending && (
        <section className="carte space-y-4">
          <h2 className="font-medium">{t.systemCheckTitle}</h2>
          <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
            {pending.scenario_label}
          </p>

          <div
            className="text-sm grid grid-cols-2 gap-2 sm:grid-cols-4 rounded p-3"
            style={{ background: "var(--color-bg)" }}
          >
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.scanId}</div>
              <div className="font-mono">{pending.scan_id}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.po}</div>
              <div className="font-mono">{pending.order_id}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.part}</div>
              <div className="font-mono">{pending.part}</div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>{t.listedQty}</div>
              <div className="font-mono">{pending.listed_quantity}</div>
            </div>
          </div>

          <div className={`message ${CLASSIFICATION_STYLE[pending.system_classification]}`}>
            <div className="font-semibold mb-1">
              {t.systemFlag}: {pending.system_classification}
              {pending.system_confidence === "low" && t.lowConfidence}
            </div>
            <div>{pending.system_reasoning}</div>
            {pending.system_classification === "AMBIGUOUS" && (
              <div className="mt-2 font-medium">{t.ambiguousHumanNote}</div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">{t.leadConfirmationTitle}</h3>

            <div className="champ">
              <label>{t.confirmOrCorrect}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDecision("NEW")}
                  className={decision === "NEW" ? "bouton" : "bouton bouton--secondaire"}
                >
                  {t.newDelivery}
                </button>
                <button
                  onClick={() => setDecision("DUPLICATE")}
                  className={decision === "DUPLICATE" ? "bouton" : "bouton bouton--secondaire"}
                >
                  {t.duplicateScanDiscard}
                </button>
              </div>
            </div>

            {decision === "NEW" && (
              <div className="champ-groupe max-w-md">
                <div className="champ">
                  <label>{t.received}</label>
                  <input
                    type="number"
                    value={received}
                    onChange={(e) => setReceived(Number(e.target.value))}
                  />
                </div>
                <div className="champ">
                  <label>{t.damaged}</label>
                  <input
                    type="number"
                    value={damaged}
                    onChange={(e) => setDamaged(Number(e.target.value))}
                  />
                </div>
                <div className="champ">
                  <label>{t.accepted}</label>
                  <input
                    type="number"
                    value={accepted}
                    onChange={(e) => setAccepted(Number(e.target.value))}
                  />
                </div>
                {damaged > 0 && (
                  <>
                    <div className="champ">
                      <label>{t.damageDescription}</label>
                      <input
                        value={damageText}
                        onChange={(e) => setDamageText(e.target.value)}
                        placeholder={t.damagePlaceholder}
                      />
                    </div>
                    <div className="champ">
                      <label>{t.damagePhoto}</label>
                      <input type="file" accept="image/*" onChange={onDamageImageChange} />
                      <span className="etiquette-statut etiquette-statut--attention">
                        {t.simulatedPhoto}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {decision === "DUPLICATE" && (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {t.duplicateConfirmNote}
              </p>
            )}

            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t.confirmingAs} <strong>{user?.name ?? "…"}</strong>.
            </p>

            {error && <p className="text-sm" style={{ color: "var(--color-erreur-text)" }}>{error}</p>}

            <button
              className="bouton bouton--sombre"
              onClick={submitConfirmation}
              disabled={busy || !decision}
            >
              {busy ? t.saving : t.confirmBtn}
            </button>
          </div>
        </section>
      )}

      <section className="carte space-y-4">
        <h2 className="font-medium">{t.currentState}</h2>

        <div>
          <h3 className="text-sm font-medium mb-2">{t.deliveryNotesLogged}</h3>
          <div className="tableau-conteneur tableau-conteneur--carte">
            <table className="tableau">
              <thead>
                <tr>
                  <th>{t.colDn}</th>
                  <th>{t.colPo}</th>
                  <th>{t.colPart}</th>
                  <th>{t.colListedQty}</th>
                  <th>{t.colRda}</th>
                  <th>{t.colDamageEvidence}</th>
                  <th>{t.colLoggedVia}</th>
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
                      <td>{r ? `${r.received} / ${r.damaged} / ${r.accepted}` : t.noReceipt}</td>
                      <td style={{ color: "var(--color-text-muted)" }}>
                        {r?.damage_evidence_text ?? (r?.damage_evidence_image ? t.photoOnly : "-")}
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
            <h3 className="text-sm font-medium mb-2">{t.discardedDuplicatesTitle}</h3>
            <div className="tableau-conteneur tableau-conteneur--carte">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>{t.colScan}</th>
                    <th>{t.colPoPart}</th>
                    <th>{t.colMatchedDn}</th>
                    <th>{t.colConfirmedAt}</th>
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
