import fs from "node:fs";
import path from "node:path";
import { ensureSchema, getPool, nextId } from "./db";
import type {
  Order,
  DeliveryNote,
  Receipt,
  PendingScan,
  DiscardedDuplicate,
  PendingInvoiceReview,
  DiscrepancyNotice,
  EvidenceLine,
  ScanClassification,
} from "./types";

// ---------------------------------------------------------------------------
// Seed data is read (never written) from ./context/initial.json, the source
// of truth provided for this exercise. Confirmed state (delivery notes,
// receipts, discarded duplicates, discrepancy notices) lives in Postgres —
// see docs/01-system-design.md §9 — and survives server restarts. A pending
// scan/invoice is a system *proposal*, not yet written per the "no write
// before confirm" rule (§3), so it stays in memory only.
// ---------------------------------------------------------------------------

type SeedData = {
  orders: Order[];
  delivery_notes: { id: string; order_id: string; part: string; listed_quantity: number }[];
  receipts: Receipt[];
};

function loadSeed(): SeedData {
  const seedPath = path.join(process.cwd(), "..", "context", "initial.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  return JSON.parse(raw) as SeedData;
}

// NOTE (disclosed): initial.json defines exactly one order, PO-1, which
// arrives already fully split-delivered (DN-1 + DN-2 = 10 of 10) in the seed
// data itself. That leaves no room to demonstrate an "ordinary brand-new
// delivery against an open PO" scan without adding a second open PO. PO-2 is
// a demo-only addition, not present in initial.json, added purely so that
// path has somewhere to land. Everything else in the seed is initial.json
// verbatim.
const DEMO_ADDED_ORDER: Order = { id: "PO-2", part: "BRAKE-PAD-Y", quantity: 5 };

type PendingMemory = {
  pendingScan: PendingScan | null;
  pendingInvoice: PendingInvoiceReview | null;
  scanScenarioIndex: number;
  invoiceScenarioIndex: number;
};

// Survives Next.js dev hot-reload by stashing on globalThis, same as the DB
// pool in ./db.ts.
const g = globalThis as unknown as { __c04Pending?: PendingMemory };
function pendingMemory(): PendingMemory {
  if (!g.__c04Pending) {
    g.__c04Pending = {
      pendingScan: null,
      pendingInvoice: null,
      scanScenarioIndex: 0,
      invoiceScenarioIndex: 0,
    };
  }
  return g.__c04Pending;
}

export type AppState = {
  orders: Order[];
  deliveryNotes: DeliveryNote[];
  receipts: Receipt[];
  discardedDuplicates: DiscardedDuplicate[];
  notices: DiscrepancyNotice[];
  pendingScan: PendingScan | null;
  pendingInvoice: PendingInvoiceReview | null;
};

export async function getState(): Promise<AppState> {
  await ensureSchema();
  const pool = getPool();
  const [orders, deliveryNotes, receipts, discardedDuplicates, notices] = await Promise.all([
    pool.query<Order>("select id, part, quantity from orders order by id"),
    pool.query<DeliveryNote>(
      "select id, order_id, part, listed_quantity, logged_via from delivery_notes order by id"
    ),
    pool.query<Receipt>(
      "select id, delivery_note, received, damaged, accepted from receipts order by id"
    ),
    pool.query<DiscardedDuplicate>(
      "select scan_id, order_id, part, listed_quantity, matched_delivery_note, confirmed_by_clerk_at from discarded_duplicates order by confirmed_by_clerk_at"
    ),
    pool.query<DiscrepancyNotice>(
      "select id, invoice_id, order_id, part, invoiced_quantity, accepted_total, discrepancy, evidence, approved_by, approved_at, simulated from discrepancy_notices order by approved_at"
    ),
  ]);
  const mem = pendingMemory();
  return {
    orders: orders.rows,
    deliveryNotes: deliveryNotes.rows,
    receipts: receipts.rows,
    discardedDuplicates: discardedDuplicates.rows,
    notices: notices.rows,
    pendingScan: mem.pendingScan,
    pendingInvoice: mem.pendingInvoice,
  };
}

export async function resetState(): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  const seed = loadSeed();

  await pool.query("begin");
  try {
    await pool.query(
      "truncate discrepancy_notices, discarded_duplicates, receipts, delivery_notes, orders, counters"
    );
    for (const o of [...seed.orders, DEMO_ADDED_ORDER]) {
      await pool.query("insert into orders (id, part, quantity) values ($1, $2, $3)", [
        o.id,
        o.part,
        o.quantity,
      ]);
    }
    for (const dn of seed.delivery_notes) {
      await pool.query(
        "insert into delivery_notes (id, order_id, part, listed_quantity, logged_via) values ($1, $2, $3, $4, 'seed')",
        [dn.id, dn.order_id, dn.part, dn.listed_quantity]
      );
    }
    for (const r of seed.receipts) {
      await pool.query(
        "insert into receipts (id, delivery_note, received, damaged, accepted) values ($1, $2, $3, $4, $5)",
        [r.id, r.delivery_note, r.received, r.damaged, r.accepted]
      );
    }
    // Seed IDs are fixed strings (DN-1, DN-2, RC-1, RC-2, ...) from
    // initial.json, not generated by nextId(). Start each prefix's counter
    // past however many the seed already used, so a freshly generated DN-1
    // never collides with the seed's own DN-1.
    await pool.query("insert into counters (key, value) values ('DN', $1)", [seed.delivery_notes.length]);
    await pool.query("insert into counters (key, value) values ('RC', $1)", [seed.receipts.length]);
    await pool.query("commit");
  } catch (err) {
    await pool.query("rollback");
    throw err;
  }

  g.__c04Pending = {
    pendingScan: null,
    pendingInvoice: null,
    scanScenarioIndex: 0,
    invoiceScenarioIndex: 0,
  };
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

function classifyScan(
  scenario: ScanScenario,
  deliveryNotes: DeliveryNote[],
  orders: Order[]
): {
  classification: ScanClassification;
  confidence: "high" | "low";
  reasoning: string;
  matched_delivery_note: string | null;
} {
  const existingForOrder = deliveryNotes.filter(
    (dn) => dn.order_id === scenario.order_id && dn.part === scenario.part
  );
  const order = orders.find((o) => o.id === scenario.order_id);
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

export async function simulateIncomingScan(): Promise<PendingScan> {
  await ensureSchema();
  const mem = pendingMemory();
  if (mem.pendingScan) {
    throw new Error(
      "A scan is already pending clerk confirmation. Confirm or resolve it before simulating another."
    );
  }
  const scenario = SCAN_SCENARIOS[mem.scanScenarioIndex % SCAN_SCENARIOS.length];
  mem.scanScenarioIndex += 1;

  const pool = getPool();
  const [deliveryNotes, orders] = await Promise.all([
    pool.query<DeliveryNote>(
      "select id, order_id, part, listed_quantity, logged_via from delivery_notes"
    ),
    pool.query<Order>("select id, part, quantity from orders"),
  ]);

  const result = classifyScan(scenario, deliveryNotes.rows, orders.rows);
  const pending: PendingScan = {
    scan_id: await nextId("SCAN"),
    order_id: scenario.order_id,
    part: scenario.part,
    listed_quantity: scenario.listed_quantity,
    system_classification: result.classification,
    system_confidence: result.confidence,
    system_reasoning: result.reasoning,
    matched_delivery_note: result.matched_delivery_note,
    scenario_label: scenario.label,
  };
  mem.pendingScan = pending;
  return pending;
}

// ---------------------------------------------------------------------------
// Step 3: clerk confirms received/damaged/accepted + confirms/corrects the
// new-vs-duplicate flag. Nothing below is written until this call happens.
// ---------------------------------------------------------------------------

export async function confirmReceipt(input: {
  scan_id: string;
  decision: "NEW" | "DUPLICATE";
  received: number;
  damaged: number;
  accepted: number;
  clerk_name: string;
}): Promise<{ deliveryNote?: DeliveryNote; receipt?: Receipt; discarded?: DiscardedDuplicate }> {
  await ensureSchema();
  const mem = pendingMemory();
  const pending = mem.pendingScan;
  if (!pending || pending.scan_id !== input.scan_id) {
    throw new Error("No matching pending scan to confirm. It may have already been resolved.");
  }

  const pool = getPool();

  if (input.decision === "DUPLICATE") {
    const discarded: DiscardedDuplicate = {
      scan_id: pending.scan_id,
      order_id: pending.order_id,
      part: pending.part,
      listed_quantity: pending.listed_quantity,
      matched_delivery_note: pending.matched_delivery_note,
      confirmed_by_clerk_at: new Date().toISOString(),
    };
    await pool.query(
      "insert into discarded_duplicates (scan_id, order_id, part, listed_quantity, matched_delivery_note, confirmed_by_clerk_at) values ($1, $2, $3, $4, $5, $6)",
      [
        discarded.scan_id,
        discarded.order_id,
        discarded.part,
        discarded.listed_quantity,
        discarded.matched_delivery_note,
        discarded.confirmed_by_clerk_at,
      ]
    );
    mem.pendingScan = null;
    return { discarded };
  }

  // decision === "NEW": create the delivery note + receipt, exactly as the
  // clerk confirmed (which may correct received/damaged/accepted from what
  // was scanned, and may override the system's suggested flag).
  const dn: DeliveryNote = {
    id: await nextId("DN"),
    order_id: pending.order_id,
    part: pending.part,
    listed_quantity: pending.listed_quantity,
    logged_via: "clerk_confirmed",
  };
  const receipt: Receipt = {
    id: await nextId("RC"),
    delivery_note: dn.id,
    received: input.received,
    damaged: input.damaged,
    accepted: input.accepted,
  };
  await pool.query(
    "insert into delivery_notes (id, order_id, part, listed_quantity, logged_via) values ($1, $2, $3, $4, $5)",
    [dn.id, dn.order_id, dn.part, dn.listed_quantity, dn.logged_via]
  );
  await pool.query(
    "insert into receipts (id, delivery_note, received, damaged, accepted) values ($1, $2, $3, $4, $5)",
    [receipt.id, receipt.delivery_note, receipt.received, receipt.damaged, receipt.accepted]
  );
  mem.pendingScan = null;
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

export async function simulateIncomingInvoice(): Promise<PendingInvoiceReview> {
  await ensureSchema();
  const mem = pendingMemory();
  if (mem.pendingInvoice) {
    throw new Error(
      "An invoice review is already pending approval. Resolve it before simulating another."
    );
  }
  const scenario = INVOICE_SCENARIOS[mem.invoiceScenarioIndex % INVOICE_SCENARIOS.length];
  mem.invoiceScenarioIndex += 1;

  const pool = getPool();
  const [deliveryNotes, receipts] = await Promise.all([
    pool.query<DeliveryNote>(
      "select id, order_id, part, listed_quantity, logged_via from delivery_notes where order_id = $1 and part = $2",
      [scenario.order_id, scenario.part]
    ),
    pool.query<Receipt>("select id, delivery_note, received, damaged, accepted from receipts"),
  ]);

  const evidence: EvidenceLine[] = deliveryNotes.rows.map((dn) => {
    const receipt = receipts.rows.find((r) => r.delivery_note === dn.id);
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
    invoice_id: await nextId("INV"),
    order_id: scenario.order_id,
    part: scenario.part,
    invoiced_quantity: scenario.quantity,
    accepted_total: acceptedTotal,
    discrepancy,
    evidence,
    scenario_label: scenario.label,
    clean: discrepancy === 0,
  };
  mem.pendingInvoice = pending;
  return pending;
}

// ---------------------------------------------------------------------------
// Step 6: human approval required before a discrepancy notice is generated.
// The notice is simulated: it is stored (in Postgres) and displayed, never
// actually sent anywhere.
// ---------------------------------------------------------------------------

export async function approveDiscrepancyNotice(input: {
  invoice_id: string;
  approved_by: string;
}): Promise<DiscrepancyNotice> {
  await ensureSchema();
  const mem = pendingMemory();
  const pending = mem.pendingInvoice;
  if (!pending || pending.invoice_id !== input.invoice_id) {
    throw new Error("No matching pending invoice review to approve.");
  }
  const notice: DiscrepancyNotice = {
    id: await nextId("NOTICE"),
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
  await getPool().query(
    `insert into discrepancy_notices
      (id, invoice_id, order_id, part, invoiced_quantity, accepted_total, discrepancy, evidence, approved_by, approved_at, simulated)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      notice.id,
      notice.invoice_id,
      notice.order_id,
      notice.part,
      notice.invoiced_quantity,
      notice.accepted_total,
      notice.discrepancy,
      JSON.stringify(notice.evidence),
      notice.approved_by,
      notice.approved_at,
      notice.simulated,
    ]
  );
  mem.pendingInvoice = null;
  return notice;
}

export function dismissPendingInvoice(): void {
  pendingMemory().pendingInvoice = null;
}
