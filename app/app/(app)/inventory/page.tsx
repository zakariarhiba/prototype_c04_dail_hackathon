"use client";

import { useEffect, useState } from "react";
import ResetButton from "../../components/ResetButton";
import { useSession } from "../../lib/useSession";
import type { InventoryLedgerLine } from "../../lib/types";

export default function InventoryPage() {
  const [ledger, setLedger] = useState<InventoryLedgerLine[] | null>(null);
  const { user } = useSession();
  const [part, setPart] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    if (data.ok) setLedger(data.ledger);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    refresh();
  }, []);

  async function submitAddStock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/add-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ part, quantity }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error);
    } else {
      setPart("");
      setQuantity(1);
    }
    await refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <div className="entete-page">
        <h1 className="text-xl font-semibold">Inventory ledger</h1>
        <ResetButton />
      </div>

      <section className="carte space-y-3">
        <h2 className="font-medium">Received-to-date by part</h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Not a live stock count — cumulative accepted quantity received to
          date, per part.
        </p>
        <div className="tableau-conteneur tableau-conteneur--carte">
          <table className="tableau">
            <thead>
              <tr>
                <th>Part</th>
                <th>Received-to-date (accepted)</th>
                <th>Last movement</th>
              </tr>
            </thead>
            <tbody>
              {ledger?.map((line) => (
                <tr key={line.part}>
                  <td className="font-mono">{line.part}</td>
                  <td>{line.on_hand_accepted}</td>
                  <td>{new Date(line.last_movement_at).toLocaleString()}</td>
                </tr>
              ))}
              {ledger?.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "var(--color-text-muted)" }}>
                    No receipts logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="carte space-y-3">
        <h2 className="font-medium">Add new stock</h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Never reaches a real supplier or inventory-of-record system.
        </p>
        <form className="champ-groupe max-w-md" onSubmit={submitAddStock}>
          <div className="champ">
            <label>Part</label>
            <input value={part} onChange={(e) => setPart(e.target.value)} placeholder="e.g. FILTER-X" required />
          </div>
          <div className="champ">
            <label>Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Adding as <strong>{user?.name ?? "…"}</strong>.
            {user && user.role !== "clerk" && (
              <span style={{ color: "var(--color-erreur-text)" }}>
                {" "}Signed in as a reconciliation lead — only a parts receiving lead can add stock.
              </span>
            )}
          </p>
          {error && <p className="text-sm" style={{ color: "var(--color-erreur-text)" }}>{error}</p>}
          <button className="bouton bouton--sombre" type="submit" disabled={busy || user?.role !== "clerk"}>
            {busy ? "Saving..." : "Add stock"}
          </button>
        </form>
      </section>
    </div>
  );
}
