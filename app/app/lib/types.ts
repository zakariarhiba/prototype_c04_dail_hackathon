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
  logged_via: "seed" | "clerk_confirmed";
};

export type Receipt = {
  id: string;
  delivery_note: string;
  received: number;
  damaged: number;
  accepted: number;
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
