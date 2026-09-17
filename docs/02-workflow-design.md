# Phase 2 — Workflow Design

## Narrow workflow (draft — confirm after interview)

A delivery note comes in → system checks it against an open PO and flags
"new delivery vs. possible duplicate scan" → clerk confirms received /
damaged / accepted → later, an invoice comes in → system reconciles the
invoice quantity against the SUM of accepted quantities across all linked
delivery notes → flags the exact discrepancy with its evidence chain (which
DN, which receipt) → a human approves the discrepancy notice before
anything is "sent" (simulated).

## Confirmed workflow (after interview)

No live client conversation was available for this exercise (see
`docs/01-client-interview.md` — confirmed with organizers). The draft above
was built as designed and is what the prototype implements, unchanged. The
one addition made during the build (not in `context/initial.json`) is a
second demo-only open PO, `PO-2` (`BRAKE-PAD-Y`, qty 5), so the "ordinary
first-time new delivery against an open PO" path has somewhere to land —
`initial.json`'s only PO, `PO-1`, arrives already fully split-delivered
(DN-1 + DN-2 = 10 of 10) in the seed data itself.

## Three paths to demonstrate (required by the brief)

**Ordinary path** (everything reconciles cleanly):
Receiving: scan against `PO-2`/`BRAKE-PAD-Y` (no existing DN for that
PO/part) → system flags NEW, high confidence → clerk confirms
received/damaged/accepted → DN + receipt created.
Invoicing: second invoice scenario bills exactly the accepted total for
`PO-1`/`FILTER-X` (9 units) → system shows "reconciles cleanly" → clerk
acknowledges, no notice generated.

**Changed-information path** (new data arrives mid-demo — simulate-event
button): each "Simulate incoming..." button is the changed-information
trigger itself — every click introduces a new event the system has not
seen, and the classification/reconciliation is (re)computed against
whatever has already been confirmed in the session, not against a fixed
script. Concretely: confirming the `PO-2` delivery from the ordinary path
changes what a later duplicate/ambiguous scan is compared against.

**Failure / uncertainty path** (system can't confidently decide, hands to
human): a scan for `PO-1`/`FILTER-X` at quantity 3 — it matches no existing
delivery note's quantity, but `PO-1` already shows its full ordered quantity
(10 of 10) logged via DN-1 + DN-2. The system cannot tell a mis-scanned
duplicate from a genuine extra/correction delivery from the scan alone, so
it returns `AMBIGUOUS` / low confidence and requires the clerk to decide
New vs. Duplicate manually before anything is written.

## Implementation Status (fill as you build — this feeds the Wolf handoff table)

| Component | Implemented or simulated? | Evidence / limitation |
|---|---|---|
| Input / event trigger | Simulated | "Simulate incoming delivery note" / "Simulate incoming invoice" buttons stand in for a scanner and an accounting/EDI feed. Each cycles through a small fixed rotation of scenario shapes so all required paths are reachable in one session. |
| Retrieval / reasoning | Real | `classifyScan` and the invoice reconciliation logic in `app/app/lib/store.ts` compute their answers from live in-memory state (existing delivery notes, receipts, PO quantities) on every call — not scripted per scenario. |
| Human review | Real | No delivery note, receipt, discard, or discrepancy notice is written without an explicit clerk confirm / approver approve action in the UI. |
| External action | Simulated | The generated discrepancy notice is stored and displayed only; nothing is sent to a supplier or posted to accounting. |
| Persistence / history | Partial | State (delivery notes, receipts, discarded-duplicate audit log, notices) persists in-memory for the life of the server process, and can be reset to the `initial.json` seed on demand. No database; lost on restart. |
