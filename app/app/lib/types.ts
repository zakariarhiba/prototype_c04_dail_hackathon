export type Order = {
  id: string;
  part: string;
  quantity: number;
};

export type DeliveryNote = {
  id: string;
  order_id: string;
  part: string;
  listed_quantity: number;
  logged_via: "seed" | "clerk_confirmed" | "clerk_added_stock";
};

export type Receipt = {
  id: string;
  delivery_note: string;
  received: number;
  damaged: number;
  accepted: number;
  created_at: string;
  damage_evidence_text: string | null;
  damage_evidence_image: string | null;
};

// v3 inventory master (docs/01-system-design.md §15) — additive to the §11
// ledger, not a replacement. qr_payload is a prototype-only identifier.
export type Part = {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity_on_hand: number;
  qr_payload: string;
  created_at: string;
};

export type PoStatus = "open" | "in_process" | "delivered" | "closed";

// v3 PO timeline (§15) — computed read-model, mirrors §11's ledger pattern.
export type PoTimelineEvent = {
  at: string;
  label: string;
};

export type PoTimeline = {
  order: Order;
  status: PoStatus;
  accepted_total: number;
  events: PoTimelineEvent[];
};

export type InventoryLedgerLine = {
  part: string;
  on_hand_accepted: number;
  last_movement_at: string;
};

export type ScanClassification = "NEW" | "DUPLICATE" | "AMBIGUOUS";

export type PendingScan = {
  scan_id: string;
  order_id: string;
  part: string;
  listed_quantity: number;
  system_classification: ScanClassification;
  system_confidence: "high" | "low";
  system_reasoning: string;
  matched_delivery_note: string | null;
  scenario_label: string;
};

export type DiscardedDuplicate = {
  scan_id: string;
  order_id: string;
  part: string;
  listed_quantity: number;
  matched_delivery_note: string | null;
  confirmed_by_clerk_at: string;
};

export type EvidenceLine = {
  delivery_note: string;
  receipt: string;
  received: number;
  damaged: number;
  accepted: number;
  note: string;
};

export type PendingInvoiceReview = {
  invoice_id: string;
  order_id: string;
  part: string;
  invoiced_quantity: number;
  accepted_total: number;
  discrepancy: number;
  evidence: EvidenceLine[];
  scenario_label: string;
  clean: boolean;
};

export type DiscrepancyNotice = {
  id: string;
  invoice_id: string;
  order_id: string;
  part: string;
  invoiced_quantity: number;
  accepted_total: number;
  discrepancy: number;
  evidence: EvidenceLine[];
  approved_by: string;
  approved_at: string;
  simulated: true;
};
