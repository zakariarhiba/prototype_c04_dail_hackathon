# Phase 3 — Build Log

## Build entries

| Time | What I asked the harness for | What it produced | Issue / fix |
|---|---|---|---|
| Build session | Next.js + in-memory API prototype for steps 1-3 (receiving: simulate scan, classify new/duplicate, clerk confirms) | `app/` Next.js 16 app, `lib/store.ts` with seeded state from `context/initial.json`, `/receiving` screen, API routes for simulate-scan/confirm-receipt/reset | Initial scenario design put the "ordinary new delivery" scan against `PO-1`, but `initial.json`'s seed already fully accounts for `PO-1` (DN-1 + DN-2 = 10 of 10), so it was misclassified as DUPLICATE on first test. Fixed by adding a disclosed demo-only second PO (`PO-2`) for that path instead of forcing a false "new" reading out of already-fully-delivered data. |
| Build session | Steps 4-6: invoice reconciliation screen, evidence view, human-approved discrepancy notice | `/invoices` screen, `simulateIncomingInvoice`/`approveDiscrepancyNotice` in `store.ts`, API routes | None — verified against seed data directly via curl before wiring the UI: invoice for 10 units vs. accepted total 9 correctly attributes the 1-unit gap to "1 unit damaged and rejected on DN-1". |
| Build session | Lint/typecheck pass | Fixed `<a>` → `next/link` in nav, added disable comment for the intentional fetch-on-mount `useEffect` pattern | `npx eslint .` and `npx tsc --noEmit` both clean after fixes. |

## Change-of-information events

### Event 1
**What changed:** Discovered while testing that `context/initial.json`'s
single PO (`PO-1`) arrives in the seed data already fully split-delivered
(`DN-1` qty 8 + `DN-2` qty 2 = 10 of 10 ordered). This meant the classifier,
when given a "brand new delivery" test scan against `PO-1`, correctly
computed DUPLICATE (because in the seed's own state, `PO-1` genuinely has no
room left) — my planned scenario data was wrong, not the logic.

**How I reacted / what I rebuilt:** Re-ran the classification logic against
the actual seed state via curl before touching the UI, confirmed the
DUPLICATE result was correct given that state, then redesigned the three
demo scenarios so the "ordinary new delivery" path uses a second,
demo-added open PO (`PO-2`/`BRAKE-PAD-Y`) instead of forcing a scenario that
the seed data can't actually support.

**Why (client-facing reasoning):** The classifier should never be "made to"
produce a particular label for demo convenience — it should reflect what
the state actually shows. Since `initial.json` only gives us one PO and it's
already fully accounted for, the honest way to demonstrate the "first-time
new delivery" path is to add another open PO and disclose that addition,
rather than quietly picking scenario numbers that happen to produce the
label we wanted.
