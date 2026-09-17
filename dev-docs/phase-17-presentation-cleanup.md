# Phase 17 — Presentation cleanup: page titles + seeded Parts

## What was asked

Zakaria, after a dry run: the "Step 1-3: Receiving" / "Step 4-6: Invoice
reconciliation" page titles read as unclear/wrong-looking numbers with
no other context in the app to anchor them to. Separately: the Parts &
QR page (and, he thought, inventory) has no simulated data ready to
present — he doesn't want to type into a form live during the demo.

## Note on phase-gate status

Phases 13-15 (and now 16) are still awaiting Zakaria's explicit
validation. As with those, this is a small, direct, explicit ask
handled ahead of those reviews.

## Investigation

Checked whether the inventory ledger was actually broken first (the
report bundled "no inventory yet" together with the titles complaint).
Ran the app against the local Postgres directly:
`select dn.part, sum(r.accepted), max(r.created_at) from receipts r
join delivery_notes dn on dn.id = r.delivery_note group by dn.part;`
— returned `FILTER-X | 9` correctly, matching seed data (`RC-1`
accepted 7 + `RC-2` accepted 2). The ledger query itself was never
broken; it only ever shows what has receipts against it, and the seed
only ever gave FILTER-X any. The Parts & QR page, on the other hand,
really was empty — `select count(*) from parts` was 0 after a reset,
confirmed against `docs/01-system-design.md` §15's note that Part is a
v3 addition not present in `initial.json`.

## What changed

- `docs/01-system-design.md` — added §18 documenting both fixes.
- `app/app/lib/i18n.tsx` — `receivingTitle` / `invoicesTitle` changed
  from `"Step 1-3: Receiving"` / `"Step 4-6: Invoice reconciliation"`
  (and German equivalents) to plain `"Receiving"` / `"Invoice
  reconciliation"` (`"Wareneingang"` / `"Rechnungsabgleich"`).
- `app/app/lib/store.ts` — added `DEMO_ADDED_PARTS` (FILTER-X,
  BRAKE-PAD-Y, WIPER-Z — the first two matching the two seeded orders'
  parts, one standalone) and wired `resetState()` to insert them as
  real `parts` rows with generated QR payloads, plus a `PART` counter
  seeded past their count so a live "Add new part" during the demo
  can't collide with the fixed `PART-1..3` ids.

## How it was verified

- `npx tsc --noEmit -p .` — clean.
- Ran the app against the real local Postgres (`docker exec
  prototype-postgres-1 psql ...`) and via `curl` against a running
  `next dev` (not a browser, per Zakaria's standing instruction):
  - Logged in as `priya_lead`, called `POST /api/reset`, then
    `GET /api/parts` — returned all 3 seeded parts (`PART-1` FILTER-X,
    `PART-2` BRAKE-PAD-Y, `PART-3` WIPER-Z) each with a real
    `qr_data_url`.
  - `GET /api/inventory` still correctly returns only `FILTER-X: 9` —
    confirms the new Part seed rows do **not** leak into the inventory
    ledger (which is receipts-derived, §11) or give BRAKE-PAD-Y a false
    received-to-date, preserving the "PO-2 starts with zero delivery
    notes" setup Step 2 of the presentation script depends on.
  - `POST /api/parts` with a new SKU (`TEST-1`) returned `PART-4` — no
    ID collision with the seeded `PART-1..3`, confirming the counter
    seed is correct.
  - Reset once more afterward to leave the database in the clean seed
    state.
- Not checked in a live browser — Zakaria will verify visually.

## Known gaps / open items

- The three seeded Parts are demo-only additions (same category as
  `DEMO_ADDED_ORDER`), not from `initial.json` — disclosed in code
  comments and §18, consistent with how `DEMO_ADDED_ORDER` is already
  disclosed.
- The three seeded parts' own `name`/`description` text (e.g. "Oil
  filter, type X") is English-only, unlike the page chrome around it
  (which phase 14 already wired to `LanguageProvider`) — same category
  as phase 14's "data, not UI copy" scope note: these are seed data
  values, not static UI strings, so the i18n dictionary doesn't touch
  them.
