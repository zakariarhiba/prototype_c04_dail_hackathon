"use client";

import { useState } from "react";
import { useLanguage } from "../lib/i18n";

export default function ResetButton() {
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();

  async function handleReset() {
    setBusy(true);
    await fetch("/api/reset", { method: "POST" });
    window.location.reload();
  }

  return (
    <button
      onClick={handleReset}
      disabled={busy}
      className="bouton bouton--secondaire text-xs"
      title="Wipe all in-memory state and reload the seed data from initial.json"
    >
      {busy ? t.resetting : t.resetSeed}
    </button>
  );
}
