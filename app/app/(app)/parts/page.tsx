"use client";

import { useEffect, useState } from "react";
import ResetButton from "../../components/ResetButton";
import { useLanguage } from "../../lib/i18n";
import type { Order, Part } from "../../lib/types";

type PartWithQr = Part & { qr_data_url: string };

export default function PartsPage() {
  const [parts, setParts] = useState<PartWithQr[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const { t } = useLanguage();

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [scanPartId, setScanPartId] = useState("");
  const [scanOrderId, setScanOrderId] = useState("");
  const [scanQty, setScanQty] = useState<number>(1);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanOk, setScanOk] = useState<string | null>(null);

  async function refresh() {
    const [partsRes, stateRes] = await Promise.all([fetch("/api/parts"), fetch("/api/state")]);
    const partsData = await partsRes.json();
    const stateData = await stateRes.json();
    if (partsData.ok) setParts(partsData.parts);
    if (stateData.orders) setOrders(stateData.orders);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh();
  }, []);

  async function submitAddPart(e: React.FormEvent) {
    e.preventDefault();
    setAddBusy(true);
    setAddError(null);
    const res = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, name, description, quantity }),
    });
    const data = await res.json();
    if (!data.ok) {
      setAddError(data.error);
    } else {
      setSku("");
      setName("");
      setDescription("");
      setQuantity(1);
    }
    await refresh();
    setAddBusy(false);
  }

  async function submitScan(e: React.FormEvent) {
    e.preventDefault();
    setScanBusy(true);
    setScanError(null);
    setScanOk(null);
    const res = await fetch("/api/simulate-scan-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ part_id: scanPartId, order_id: scanOrderId, listed_quantity: scanQty }),
    });
    const data = await res.json();
    if (!data.ok) {
      setScanError(data.error);
    } else {
      setScanOk(`Scan ${data.pendingScan.scan_id} created — go to Receiving to review and confirm it.`);
    }
    setScanBusy(false);
  }

  return (
    <div className="space-y-8">
      <div className="entete-page">
        <h1 className="text-xl font-semibold">{t.partsQrTitle}</h1>
        <ResetButton />
      </div>

      <section className="carte space-y-3">
        <h2 className="font-medium">{t.addNewPart}</h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {t.addPartNote}
        </p>
        <form className="champ-groupe max-w-md" onSubmit={submitAddPart}>
          <div className="champ">
            <label>{t.skuLabel}</label>
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. FILTER-X" required />
          </div>
          <div className="champ">
            <label>{t.nameLabel}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oil filter, type X" required />
          </div>
          <div className="champ">
            <label>{t.descriptionLabel}</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional" />
          </div>
          <div className="champ">
            <label>{t.startingQuantityLabel}</label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>
          {addError && <p className="text-sm" style={{ color: "var(--color-erreur-text)" }}>{addError}</p>}
          <button className="bouton bouton--sombre" type="submit" disabled={addBusy}>
            {addBusy ? t.saving : t.addPartBtn}
          </button>
        </form>
      </section>

      <section className="carte space-y-3">
        <h2 className="font-medium">{t.simulateOutboundScan}</h2>
        <span className="etiquette-statut etiquette-statut--attention">{t.simulatedNoCamera}</span>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {t.simulateScanNote}
        </p>
        <form className="champ-groupe max-w-md" onSubmit={submitScan}>
          <div className="champ">
            <label>{t.partLabel}</label>
            <select value={scanPartId} onChange={(e) => setScanPartId(e.target.value)} required>
              <option value="">{t.selectPartPlaceholder}</option>
              {parts?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="champ">
            <label>{t.po}</label>
            <select value={scanOrderId} onChange={(e) => setScanOrderId(e.target.value)} required>
              <option value="">{t.selectPoPlaceholder}</option>
              {orders?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} — {o.part} (qty {o.quantity})
                </option>
              ))}
            </select>
          </div>
          <div className="champ">
            <label>{t.quantityOnDelivery}</label>
            <input
              type="number"
              min={1}
              value={scanQty}
              onChange={(e) => setScanQty(Number(e.target.value))}
              required
            />
          </div>
          {scanError && <p className="text-sm" style={{ color: "var(--color-erreur-text)" }}>{scanError}</p>}
          {scanOk && <p className="text-sm" style={{ color: "var(--color-succes-text, inherit)" }}>{scanOk}</p>}
          <button className="bouton" type="submit" disabled={scanBusy || !scanPartId || !scanOrderId}>
            {scanBusy ? t.scanning : t.scanBtn}
          </button>
        </form>
      </section>

      <section className="carte space-y-3">
        <h2 className="font-medium">{t.partsTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parts?.map((p) => (
            <div key={p.id} className="carte space-y-2" style={{ background: "var(--color-bg)" }}>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL, not a static asset */}
                <img src={p.qr_data_url} alt={`QR for ${p.sku}`} width={72} height={72} />
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {p.sku} · {p.id}
                  </div>
                </div>
              </div>
              {p.description && <p className="text-sm">{p.description}</p>}
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {t.startingQuantityShown}: {p.quantity_on_hand}
              </p>
            </div>
          ))}
          {parts?.length === 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t.noPartsYet}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
