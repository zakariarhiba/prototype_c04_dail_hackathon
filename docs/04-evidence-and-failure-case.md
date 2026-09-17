# Phase 4 — Evidence View & Failure Case

## Evidence view

On `/invoices`, once an invoice is simulated, the reconciliation panel
shows a per-delivery-note table (DN id, receipt id, received, damaged,
accepted, a plain-language note) and then states the gap in one sentence,
e.g.:

> Invoice bills 10; delivery notes above accepted 9 in total. Gap of 1
> unit(s) = 1 damaged/rejected on DN-1, not credited on the invoice.

This is generated from the actual receipt records for every delivery note
linked to the invoiced PO/part (`simulateIncomingInvoice` in
`app/app/lib/store.ts`), not a canned string — if a different receipt were
confirmed during the session (e.g. no damage, or damage on a different DN),
the evidence text and the named DN would change accordingly.

## Uncertain / failure case

**The case:** A delivery-note scan arrives for `PO-1`/`FILTER-X` at quantity
3. `PO-1` already has `DN-1` (qty 8) and `DN-2` (qty 2) logged, covering the
full ordered quantity of 10. The incoming quantity (3) doesn't match either
existing delivery note, so it isn't a clean duplicate by exact match — but
the PO already shows fully accounted for, so it isn't a clean "next split
delivery" either.

**What the system shows:** A flag of `AMBIGUOUS` with low confidence and
the stated reasoning:

> PO-1/FILTER-X already shows 10 of 10 ordered units logged via DN-1, DN-2.
> This scan would push the logged total past the ordered quantity. It could
> be a mis-scanned duplicate, a correction, or a genuine extra delivery —
> the system cannot tell which from the scan alone.

The UI does not pre-select New or Duplicate for this case (unlike the
NEW/DUPLICATE scenarios, where the system's suggestion is pre-selected and
the clerk can simply confirm or override it). It's shown in red, and a line
below the classification states plainly: "The system will not guess here —
a human must decide new vs. duplicate below."

**What the human is asked to decide:** The receiving clerk must pick New or
Duplicate explicitly before anything is written — there is no default
action and no auto-timeout that picks one. If they pick New, a delivery
note and receipt are created for the extra 3 units and it becomes part of
future invoice reconciliation; if they pick Duplicate, the scan is
discarded and logged to the audit trail with no state change.
