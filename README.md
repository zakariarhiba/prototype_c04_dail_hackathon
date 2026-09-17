# C04 — Delivery Note / Invoice Reconciliation Prototype

Synthetic exercise (Dail Octopus, case C04). Not a real client, not connected
to any real system. See `context/` for the source-of-truth brief, interview
notes, and test data — that directory is not modified by the prototype.

> **Status:** the app below is a v1 build, kept as a working reference. We
> are re-designing before extending it further — see `docs/01-system-design.md`
> for the current design and `TASKS.md` for what's in progress. Read
> `AGENTS.md` first if you're picking up work here.

## What this is

The client's pain: at the loading bay they record what arrived; later
someone reconciles the invoice and cannot tell whether a difference is a
shortage, a damaged item, a duplicate scan, or a second delivery.

This prototype demonstrates one narrow slice of that workflow, end to end,
with a human confirming every write:

1. **Receiving** (`/receiving`) — simulate an incoming delivery-note scan.
   The system checks it against open POs and flags **new vs. duplicate**
   with a stated reason. The receiving clerk confirms/corrects
   received/damaged/accepted quantities and confirms/corrects the flag.
   Nothing is written to state until the clerk confirms. One scenario is
   genuinely ambiguous and the system refuses to guess, handing the decision
   to the clerk instead.
2. **Invoice reconciliation** (`/invoices`) — simulate an incoming invoice
   for the PO. The system reconciles the invoiced quantity against the
   **sum of accepted quantities** (not received) across every delivery note
   logged for that PO, and shows a line-by-line evidence trail for any
   mismatch (e.g. "1 unit damaged and rejected on DN-1, not credited on the
   invoice"). A human must approve before a discrepancy notice is generated;
   the notice is simulated and displayed only, never sent.

## Run instructions

```bash
cd app
npm install   # already run once during the build; safe to skip if node_modules exists
npm run dev -- -p 3311
```

Open `http://localhost:3311`. Use the "Reset to seed state" button on any
page to wipe in-memory state and reload from `context/initial.json` for a
repeatable demo start.

## Data flow

- Seed data (`PO-1`, `DN-1`, `DN-2`, their receipts, `INV-1`) is read
  read-only from `context/initial.json` on server start.
- All state after that (new delivery notes, receipts, discarded-duplicate
  log, discrepancy notices) lives in an in-memory store
  (`app/app/lib/store.ts`) and is lost on server restart — this is a
  prototype, not a persistence layer.
- `app/app/lib/store.ts` also holds all the actual classification and
  reconciliation logic. It is the file to read to see exactly what is
  "real" here.

## Real vs. simulated (for the handoff)

**Real, computed logic:**
- New-vs-duplicate classification (`classifyScan` in `store.ts`): looks at
  which delivery notes already exist for the scanned PO/part, whether the
  quantity exactly matches an existing one, and whether the PO's ordered
  quantity is already fully covered — computed fresh from live state on
  every scan, not a scripted per-scenario answer.
  - Rule of thumb encoded: no existing DN for that PO/part → NEW. An exact
    quantity match against an existing DN, once the PO is already fully
    covered → DUPLICATE. A same-size second delivery, or an
    unexplained-quantity extra scan, while the PO isn't (or is only just)
    fully covered → AMBIGUOUS, handed to the human.
- Invoice reconciliation (`simulateIncomingInvoice` in `store.ts`): sums
  `accepted` (not `received`) across every delivery note tied to the
  invoiced PO/part, diffs against the invoiced quantity, and builds the
  per-DN evidence lines from real receipt data.
- The gate that nothing is written to state without an explicit human
  confirmation/approval action (clerk confirm, or invoice-notice approve).

**Simulated / hardcoded, clearly labeled in the UI:**
- The incoming scan and incoming invoice events themselves — there is no
  real scanner or accounting feed. Each "Simulate incoming..." button
  advances through a small fixed rotation of scenario *shapes* (their
  PO/part/quantity), so the demo reliably exercises the ordinary, duplicate,
  ambiguous, and clean/mismatched paths. What the system *concludes* about
  whichever scenario shape comes up is still computed live, not scripted.
- `PO-2` / `BRAKE-PAD-Y` is a demo-added open order, not present in
  `context/initial.json`. It exists only so the "ordinary new delivery
  against an open PO" path has somewhere to land — `initial.json`'s only
  order, PO-1, already arrives fully split-delivered (DN-1 + DN-2 = 10 of
  10) in the seed data itself, leaving no room to demonstrate a first-time
  new delivery against it.
- The discrepancy notice: generated and displayed after human approval,
  never actually sent to a supplier or posted to accounting.
- Names entered for "clerk" / "approver" are free-text, not tied to a real
  auth system.

## Limitations

- Single-process in-memory state — no database, no multi-user concurrency
  handling, no persistence across restarts.
- Classification heuristic is intentionally simple (exact-quantity /
  PO-coverage matching). It has not been validated against real scan data,
  OCR noise, partial barcodes, or suppliers who split differently than this
  dataset assumes.
- No authentication; anyone with the URL can act as "the clerk" or "the
  approver".
- Only one part/PO shape is exercised in depth (`FILTER-X` on `PO-1`, plus
  the demo-added `PO-2`); multi-line delivery notes, multiple parts per DN,
  and partial invoices are not modeled.

## Next validation test

Before trusting the duplicate-detection heuristic on a real loading bay: run
it against a week of real (or realistically messy) scan logs from one
dealership and check the false-positive/false-negative rate on genuine
duplicate scans vs. legitimate back-to-back split deliveries — this is
exactly the case the heuristic is weakest on (see `AMBIGUOUS` path).

See `docs/05-wolf-handoff.md` for the fuller handoff (next integration,
access needed, owner, unresolved risk) and the rest of `docs/` for the
working log kept during the build.
