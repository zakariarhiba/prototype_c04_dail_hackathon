import fs from "node:fs";
import path from "node:path";
import type {
  Order,
  DeliveryNote,
  Receipt,
  Invoice,
  PendingScan,
  DiscardedDuplicate,
  PendingInvoiceReview,
  DiscrepancyNotice,
  EvidenceLine,
  ScanClassification,
} from "./types";

// ---------------------------------------------------------------------------
// Seed data is read (never written) from ./context/initial.json, the source
// of truth provided for this exercise. Everything below this seed is
// in-memory only and resets on server restart or via POST /api/reset.
// ---------------------------------------------------------------------------

type SeedData = {
  orders: Order[];
  delivery_notes: { id: string; order_id: string; part: string; listed_quantity: number }[];
  receipts: Receipt[];
  invoices: { id: string; delivery_notes: string[]; part: string; quantity: number }[];
};

function loadSeed(): SeedData {
  const seedPath = path.join(process.cwd(), "..", "context", "initial.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  return JSON.parse(raw) as SeedData;
}

export type AppState = {
  orders: Order[];
  deliveryNotes: DeliveryNote[];
  receipts: Receipt[];
  invoices: Invoice[]; // invoices already known at seed time (unused by simulate flow, kept for reference)
  discardedDuplicates: DiscardedDuplicate[];
  notices: DiscrepancyNotice[];
  pendingScan: PendingScan | null;
  pendingInvoice: PendingInvoiceReview | null;
  scanScenarioIndex: number;
  invoiceScenarioIndex: number;
  idCounter: number;
};

// NOTE (disclosed): initial.json defines exactly one order, PO-1, which
// arrives already fully split-delivered (DN-1 + DN-2 = 10 of 10) in the seed
// data itself. That leaves no room to demonstrate an "ordinary brand-new
// delivery against an open PO" scan without adding a second open PO. PO-2 is
// a demo-only addition, not present in initial.json, added purely so that
// path has somewhere to land. Everything else in the seed is initial.json
// verbatim.
const DEMO_ADDED_ORDER: Order = { id: "PO-2", part: "BRAKE-PAD-Y", quantity: 5 };

function freshState(): AppState {
  const seed = loadSeed();
  return {
    orders: [...seed.orders.map((o) => ({ ...o })), { ...DEMO_ADDED_ORDER }],
    deliveryNotes: seed.delivery_notes.map((dn) => ({ ...dn, logged_via: "seed" as const })),
    receipts: seed.receipts.map((r) => ({ ...r })),
    invoices: seed.invoices.map((i) => ({ ...i, order_id: findOrderForDN(seed, i.delivery_notes[0]) })),
    discardedDuplicates: [],
    notices: [],
    pendingScan: null,
    pendingInvoice: null,
    scanScenarioIndex: 0,
    invoiceScenarioIndex: 0,
    idCounter: 1,
  };
}

function findOrderForDN(seed: SeedData, dnId: string): string {
  const dn = seed.delivery_notes.find((d) => d.id === dnId);
  return dn ? dn.order_id : seed.orders[0]?.id ?? "PO-1";
}

// Survive Next.js dev hot-reload by stashing state on globalThis.
const g = globalThis as unknown as { __c04Store?: AppState };
if (!g.__c04Store) {
  g.__c04Store = freshState();
}

export function getState(): AppState {
  return g.__c04Store!;
}

export function resetState(): AppState {
  g.__c04Store = freshState();
  return g.__c04Store;
}

function nextId(prefix: string): string {
  const s = getState();
  const id = `${prefix}-${s.idCounter}`;
  s.idCounter += 1;
  return id;
}

// ---------------------------------------------------------------------------
// Step 1-2: incoming delivery-note scan simulation + new-vs-duplicate check
//
// REAL LOGIC: classifyScan() below computes its verdict from current store
// state every time it runs (which delivery notes already exist for this PO,
// how much of the PO is already accounted for). It is not a hardcoded
// per-scenario answer.
//
// SIMULATED: the *arrival* of a scan is simulated (there is no real scanner).
// A fixed rotation of three scenario shapes (new / duplicate / ambiguous) is
// used so the demo reliably exercises all three required paths, but what the
// system concludes about each one is computed, not scripted.
// ---------------------------------------------------------------------------

type ScanScenario = {
  label: string;
  order_id: string;
  part: string;
  listed_quantity: number;
};

const SCAN_SCENARIOS: ScanScenario[] = [
  {
    label: "Ordinary path: first delivery against open PO-2 (demo-added order, see note above)",
    order_id: "PO-2",
    part: "BRAKE-PAD-Y",
    listed_quantity: 5,
  },
  {
    label: "Duplicate path: loading-bay clerk re-scans DN-1's barcode",
    order_id: "PO-1",
    part: "FILTER-X",
    listed_quantity: 8,
  },
  {
    label: "Failure/uncertain path: unexplained extra scan for PO-1/FILTER-X that matches no existing delivery note, after the PO already shows fully accounted for",
    order_id: "PO-1",
    part: "FILTER-X",
    listed_quantity: 3,
  },
];

function classifyScan(scenario: ScanScenario): {
  classification: ScanClassification;
  confidence: "high" | "low";
  reasoning: string;
  matched_delivery_note: string | null;
} {
  const s = getState();
  const existingForOrder = s.deliveryNotes.filter(
    (dn) => dn.order_id === scenario.order_id && dn.part === scenario.part
  );
  const order = s.orders.find((o) => o.id === scenario.order_id);
  const orderedQty = order?.quantity ?? 0;

  const exactMatch = existingForOrder.find((dn) => dn.listed_quantity === scenario.listed_quantity);
  const alreadyLogged = existingForOrder.reduce((sum, dn) => sum + dn.listed_quantity, 0);

  // No delivery note yet exists for this PO/part at all -> clearly new.
  if (existingForOrder.length === 0) {
    return {
      classification: "NEW",
      confidence: "high",
      reasoning: `No delivery note is logged yet against ${scenario.order_id} for ${scenario.part}. Treated as a new delivery.`,
      matched_delivery_note: null,
    };
  }

  // An identical listed_quantity already exists for this PO/part, and the
  // order is not under-delivered enough to explain a second identical line
  // -> looks like the same physical document scanned twice.
  if (exactMatch && alreadyLogged >= orderedQty) {
    return {
      classification: "DUPLICATE",
      confidence: "high",
      reasoning: `${scenario.order_id}/${scenario.part} already has ${exactMatch.id} logged for the same quantity (${scenario.listed_quantity}), and the PO's full ordered quantity (${orderedQty}) is already covered by logged delivery notes. Looks like a re-scan of ${exactMatch.id}, not a new document.`,
      matched_delivery_note: exactMatch.id,
    };
  }

  if (exactMatch) {
    // Same quantity as an existing DN, but the PO still isn't fully covered
    // — could still be a genuine second delivery for the same quantity.
    return {
      classification: "AMBIGUOUS",
      confidence: "low",
      reasoning: `${scenario.order_id}/${scenario.part} already has ${exactMatch.id} logged for the same quantity (${scenario.listed_quantity}), but only ${alreadyLogged} of ${orderedQty} ordered units are logged so far — a second delivery of the same size is still plausible. Cannot confidently tell a re-scan of ${exactMatch.id} apart from a genuine new delivery of equal size.`,
      matched_delivery_note: exactMatch.id,
    };
  }

  // Different quantity than anything on file. If accepting it would push
  // logged quantity past what was ordered, that overshoot is exactly the
  // "duplicate scan with a typo, or genuine over-delivery/correction" case
  // the client flagged — don't guess.
  if (alreadyLogged >= orderedQty) {
    return {
      classification: "AMBIGUOUS",
      confidence: "low",
      reasoning: `${scenario.order_id}/${scenario.part} already shows ${alreadyLogged} of ${orderedQty} ordered units logged via ${existingForOrder.map((d) => d.id).join(", ")}. This scan would push the logged total past the ordered quantity. It could be a mis-scanned duplicate, a correction, or a genuine extra delivery — the system cannot tell which from the scan alone.`,
      matched_delivery_note: null,
    };
  }

  return {
    classification: "NEW",
    confidence: "high",
    reasoning: `${scenario.order_id}/${scenario.part} has ${alreadyLogged} of ${orderedQty} ordered units logged so far; this scan's quantity fits as a further split delivery, not a repeat of an existing line.`,
    matched_delivery_note: null,
  };
}

export function simulateIncomingScan(): PendingScan {
  const s = getState();
  const scenario = SCAN_SCENARIOS[s.scanScenarioIndex % SCAN_SCENARIOS.length];
  s.scanScenarioIndex += 1;

  const result = classifyScan(scenario);
  const pending: PendingScan = {
    scan_id: nextId("SCAN"),
    order_id: scenario.order_id,
    part: scenario.part,
    listed_quantity: scenario.listed_quantity,
    system_classification: result.classification,
    system_confidence: result.confidence,
    system_reasoning: result.reasoning,
    matched_delivery_note: result.matched_delivery_note,
    scenario_label: scenario.label,
  };
  s.pendingScan = pending;
  return pending;
}

// ---------------------------------------------------------------------------
// Step 3: clerk confirms received/damaged/accepted + confirms/corrects the
// new-vs-duplicate flag. Nothing below is written until this call happens.
// ---------------------------------------------------------------------------

export function confirmReceipt(input: {
  scan_id: string;
  decision: "NEW" | "DUPLICATE";
  received: number;
  damaged: number;
  accepted: number;
  clerk_name: string;
}): { deliveryNote?: DeliveryNote; receipt?: Receipt; discarded?: DiscardedDuplicate } {
  const s = getState();
  const pending = s.pendingScan;
  if (!pending || pending.scan_id !== input.scan_id) {
    throw new Error("No matching pending scan to confirm. It may have already been resolved.");
  }

  if (input.decision === "DUPLICATE") {
    const discarded: DiscardedDuplicate = {
      scan_id: pending.scan_id,
      order_id: pending.order_id,
      part: pending.part,
      listed_quantity: pending.listed_quantity,
      matched_delivery_note: pending.matched_delivery_note,
      confirmed_by_clerk_at: new Date().toISOString(),
    };
    s.discardedDuplicates.push(discarded);
    s.pendingScan = null;
    return { discarded };
  }

  // decision === "NEW": create the delivery note + receipt, exactly as the
  // clerk confirmed (which may correct received/damaged/accepted from what
  // was scanned, and may override the system's suggested flag).
  const dn: DeliveryNote = {
    id: nextId("DN"),
    order_id: pending.order_id,
    part: pending.part,
    listed_quantity: pending.listed_quantity,
    logged_via: "clerk_confirmed",
  };
  const receipt: Receipt = {
    id: nextId("RC"),
    delivery_note: dn.id,
    received: input.received,
    damaged: input.damaged,
    accepted: input.accepted,
  };
  s.deliveryNotes.push(dn);
  s.receipts.push(receipt);
  s.pendingScan = null;
  return { deliveryNote: dn, receipt };
}

// ---------------------------------------------------------------------------
// Step 4-5: invoice arrives for a PO. REAL LOGIC: reconciliation sums
// accepted (not received) quantities across every delivery note currently
// linked to that PO/invoice, and builds a line-by-line evidence trail
// explaining any gap.
// ---------------------------------------------------------------------------

type InvoiceScenario = {
  label: string;
  order_id: string;
  part: string;
  quantity: number;
};

const INVOICE_SCENARIOS: InvoiceScenario[] = [
  {
    label: "Invoice bills for the full PO quantity, ignoring the damaged unit rejected at receiving",
    order_id: "PO-1",
    part: "FILTER-X",
    quantity: 10,
  },
  {
    label: "Invoice correctly bills only for what was actually accepted",
    order_id: "PO-1",
    part: "FILTER-X",
    quantity: 9,
  },
];

export function simulateIncomingInvoice(): PendingInvoiceReview {
  const s = getState();
  const scenario = INVOICE_SCENARIOS[s.invoiceScenarioIndex % INVOICE_SCENARIOS.length];
  s.invoiceScenarioIndex += 1;

  const linkedDNs = s.deliveryNotes.filter(
    (dn) => dn.order_id === scenario.order_id && dn.part === scenario.part
  );
  const evidence: EvidenceLine[] = linkedDNs.map((dn) => {
    const receipt = s.receipts.find((r) => r.delivery_note === dn.id);
    const received = receipt?.received ?? 0;
    const damaged = receipt?.damaged ?? 0;
    const accepted = receipt?.accepted ?? 0;
    let note = `Received ${received}, accepted ${accepted}.`;
    if (damaged > 0) {
      note = `${damaged} unit${damaged === 1 ? "" : "s"} damaged and rejected on ${dn.id}, ${accepted} accepted.`;
    }
    return {
      delivery_note: dn.id,
      receipt: receipt?.id ?? "(none logged)",
      received,
      damaged,
      accepted,
      note,
    };
  });

  const acceptedTotal = evidence.reduce((sum, e) => sum + e.accepted, 0);
  const discrepancy = scenario.quantity - acceptedTotal;

  const pending: PendingInvoiceReview = {
    invoice_id: nextId("INV"),
    order_id: scenario.order_id,
    part: scenario.part,
    invoiced_quantity: scenario.quantity,
    accepted_total: acceptedTotal,
    discrepancy,
    evidence,
    scenario_label: scenario.label,
    clean: discrepancy === 0,
  };
  s.pendingInvoice = pending;
  return pending;
}

// ---------------------------------------------------------------------------
// Step 6: human approval required before a discrepancy notice is generated.
// The notice is simulated: it is stored locally and displayed, never sent.
// ---------------------------------------------------------------------------

export function approveDiscrepancyNotice(input: {
  invoice_id: string;
  approved_by: string;
}): DiscrepancyNotice {
  const s = getState();
  const pending = s.pendingInvoice;
  if (!pending || pending.invoice_id !== input.invoice_id) {
    throw new Error("No matching pending invoice review to approve.");
  }
  const notice: DiscrepancyNotice = {
    id: nextId("NOTICE"),
    invoice_id: pending.invoice_id,
    order_id: pending.order_id,
    part: pending.part,
    invoiced_quantity: pending.invoiced_quantity,
    accepted_total: pending.accepted_total,
    discrepancy: pending.discrepancy,
    evidence: pending.evidence,
    approved_by: input.approved_by,
    approved_at: new Date().toISOString(),
    simulated: true,
  };
  s.notices.push(notice);
  s.pendingInvoice = null;
  return notice;
}

export function dismissPendingInvoice(): void {
  const s = getState();
  s.pendingInvoice = null;
}
