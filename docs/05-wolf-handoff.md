# Prototype Handoff (Wolf Handoff — C04)

Case: C04. Candidate/team: Zakaria. Prototype location: `prototype/app`
(Next.js), run with `npm run dev -- -p 3311` from that directory.

## The problem we validated

Actor, painful moment and consequence: the receiving clerk at the loading
bay logs what arrives; later, whoever reconciles the invoice against the PO
has no way to tell whether a shortfall is a real shortage, a damaged unit
that was never credited, a duplicate scan of the same paper delivery note,
or a second genuine delivery. That ambiguity means discrepancies either go
uninvestigated or get chased manually with no evidence trail.

Client evidence: `context/docs/01-client-interview.md` and `brief.md` — no
live client conversation for this exercise; treated the brief's stated pain
and `initial.json`'s data model (one PO, multiple delivery notes, receipts
with received/damaged/accepted kept separate, one invoice referencing
multiple delivery notes) as the facts to design against.

What the client changed in our understanding: nothing changed mid-exercise
(no live client), but building against the real seed data changed our own
scenario design — see build log Event 1: `initial.json`'s single PO arrives
already fully split-delivered in the seed itself, so a genuinely "new"
first-time delivery needed a second, disclosed demo PO to have somewhere to
land.

What remains an assumption: who currently does the reconciliation
(receiving vs. accounting); what "resolving" a flagged mismatch looks like
today; how urgently a flagged discrepancy needs a response (assumed
same-day). All carried from `context/docs/01-client-interview.md`.

## Open and demonstrate it

Exact run instructions and start state: `cd prototype/app && npm run dev --
-p 3311`, open `http://localhost:3311`. State seeds from
`context/initial.json` on first load; use "Reset to seed state" on any page
for a repeatable start.

**Ordinary path:** `/receiving` → simulate → first scenario is a new
delivery against demo PO `PO-2` → confirm as New with
received/damaged/accepted → then `/invoices` → simulate a second time to
reach the clean-reconciliation invoice scenario → acknowledge, no notice.

**Changed-information path:** every simulate click is itself a new,
previously-unseen event evaluated against whatever the clerk has already
confirmed in-session — e.g. confirming the `PO-2` delivery changes the state
that the next scan or invoice is checked against.

**Failure or uncertainty path:** `/receiving` → simulate a third time to
reach the `PO-1`/qty-3 scenario → system returns `AMBIGUOUS`, refuses to
pre-select New or Duplicate, and requires the clerk to choose explicitly.

## What is real

| Component | Implemented or simulated | Evidence and limitation |
|---|---|---|
| Input and event trigger | Simulated | Buttons stand in for a scanner / accounting feed; cycle through a fixed rotation of scenario shapes, disclosed in the UI. |
| Retrieval / reasoning | Real | Classification and reconciliation are computed from live in-memory state each call (`app/app/lib/store.ts`), not scripted per scenario. Heuristic is simple (exact-quantity match + PO-coverage check) and unvalidated against real scan noise. |
| Human review | Real | No write happens without an explicit clerk confirm or approver approve click; ambiguous cases have no default selection. |
| External action | Simulated | Discrepancy notice is generated and displayed only; nothing is sent to a supplier or posted to accounting. |
| Persistence and history | Partial | In-memory for the life of the process; resettable to seed; no database, no multi-user concurrency. |

## Next client validation

One real case we would test: run the duplicate/new classifier against a
week of a real dealership's actual scan logs (with realistic noise — OCR
misreads, partial barcodes, back-to-back genuine split deliveries) and
measure false-positive/false-negative rate on the AMBIGUOUS and DUPLICATE
calls specifically, since that's where the heuristic is weakest.

What counts as success: the clerk agrees with the system's NEW/DUPLICATE
suggestion often enough that it's net time-saving, and the AMBIGUOUS
hand-off rate is low enough to not become its own workload — while never
silently auto-resolving a genuine duplicate-vs-new call.

Who evaluates it: the receiving clerk(s) who would use it day to day, with
the parts/accounting reconciliation owner reviewing the invoice-side
evidence output.

## Wolf work

Required integration and permission: read access to the dealership's PO/DN
system (or DMS) for open orders and delivery notes, and to the invoicing
system for incoming invoices; write access (eventually, post-validation)
to log confirmed receipts and discrepancy notices back into those systems.

Data boundary and model processing location: no LLM/model call is made in
this prototype — the classification and reconciliation are deterministic
rule-based logic, not model inference. If a future version incorporates
OCR or fuzzy matching, that would need its own data-boundary review before
handling real supplier/customer records.

Failure/recovery plan: not built — this prototype has no retry, no
idempotency key for scans, no persistence beyond process memory. A
production version needs at minimum a durable store and a defined behavior
for a scan/invoice event arriving twice through the real integration.

Monitoring owner: not assigned; would need to be the same owner reviewing
the AMBIGUOUS hand-off rate above.

Scope and effort drivers: number of distinct DMS/accounting systems in use
across dealerships (each is a separate integration surface); volume and
quality of real scan data available to tune/validate the classifier; whether
write-back to source systems is in scope for v1 or reconciliation stays
read-only/advisory. (No price or delivery commitment implied.)

Next action and owner: get one real (or realistically messy) week of scan
and invoice data from a pilot dealership to run the validation test above;
owner is whoever picks this up post-exercise, not assigned within this
prototype.
