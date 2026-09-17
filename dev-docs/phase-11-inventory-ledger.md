# Phase 11 — Inventory ledger

## What was asked

`docs/01-system-design.md` §11 (part of the phase-09 design addendum,
validated by Zakaria 2026-09-17): a read-model showing cumulative accepted
quantity received to date per part (`InventoryLedgerLine`: `part`,
`on_hand_accepted`, `last_movement_at`), derived live from `receipts` on
every read — not a separately maintained counter, so it can never drift.
Plus "add new stock": a clerk-entered `{part, quantity}` as a real write to
this app's own tables, extending the existing clerk-confirm write gate from
§3. Per `TASKS.md` Phase 5, both belong to this dev phase.

## Design decision made before building (per AGENTS.md "design before build")

§11 didn't specify where `last_movement_at` comes from — `receipts` had no
timestamp column. Added a short addition to §11 (see
`docs/01-system-design.md` diff) before writing code: `receipts.created_at
timestamptz not null default now()`, backfilled on existing rows by the
column default, `last_movement_at` = `max(created_at)` per part. Also
spelled out the exact "add new stock" shape (one `Order` + one
`DeliveryNote` with a new `logged_via = 'clerk_added_stock'` value + one
fully-accepted `Receipt`) in the same edit.

## What changed

**`db/schema.sql`**: added `receipts.created_at`, plus an idempotent
`alter table ... add column if not exists` so an already-running database
(this one, from phase 10's testing) picks up the column without a manual
migration step.

**`app/app/lib/types.ts`**: `Receipt.created_at: string` (now required —
updated both call sites that construct a `Receipt` literal in `store.ts`);
`DeliveryNote.logged_via` gained `"clerk_added_stock"`; new
`InventoryLedgerLine` type.

**`app/app/lib/store.ts`**:
- `getInventoryLedger()` — `SUM(receipts.accepted)::int` grouped by
  `delivery_notes.part`, `MAX(receipts.created_at)`, ordered by part.
- `addNewStock({part, quantity, clerk_name})` — validates `part` non-empty
  and `quantity` a positive integer, then inserts one `orders` row, one
  `delivery_notes` row (`logged_via = 'clerk_added_stock'`), one `receipts`
  row (`received = accepted = quantity`, `damaged = 0`). `clerk_name` is
  accepted but not persisted, matching the existing `confirmReceipt`
  pattern (no column exists to store it on any of these tables).
- `resetState()` now also seeds a `'PO'` counter (`seed.orders.length + 1`)
  so `nextId('PO')` from `addNewStock` never collides with the two fixed
  seed order IDs (`PO-1`, `PO-2`).
- `getState()`/other `receipts` queries updated to select the new
  `created_at` column.

**New API routes**:
- `GET /api/inventory` — any authenticated session, returns the ledger.
- `POST /api/add-stock` — 401 if no session, 403 if `role !== clerk`
  (same gate as `confirm-receipt`), calls `addNewStock` with
  `clerk_name` server-derived from the session.

**New page `app/app/(app)/inventory/page.tsx`**: ledger table (labeled
"Received-to-date by part," explicitly not "stock on hand," per §11) plus
an "Add new stock" form, submit disabled and an inline message shown when
the signed-in role isn't `clerk` (same pattern as the receiving/invoices
pages from phase 10).

**Nav**: new `BoxIcon` in `app/app/components/icons.tsx`; `Inventory` link
added to the sidebar in `app/app/(app)/layout.tsx`; `app/proxy.ts`'s
matcher extended to include `/inventory/:path*`.

**`README.md`**: "What this is" gained a third numbered item for the
inventory ledger; "Real vs. simulated" documents the ledger derivation and
the add-stock write; "Limitations" notes the ledger inherits the
one-part-per-delivery-note assumption.

## How it was verified

- `npx tsc --noEmit` — clean after fixing two `Receipt` literals in
  `store.ts` (in `confirmReceipt` and the pre-existing seed-insert path)
  that were missing the newly-required `created_at` field.
- `npx eslint .` — same single pre-existing unrelated error in
  `ThemeToggle.tsx` as phase 10; nothing new.
- Ran the dev server against the real docker-compose Postgres, drove the
  HTTP surface with `curl`:
  - `POST /api/reset` → `{"ok":true}`.
  - Logged in as both demo users (cookie jars from phase 10 still valid).
  - `GET /api/inventory` on a freshly reset DB → one line,
    `{"part":"FILTER-X","on_hand_accepted":9,"last_movement_at":"..."}` —
    matches the seed data (DN-1: 8 received/1 damaged/7 accepted, DN-2: 2
    received/0 damaged/2 accepted → 9 accepted total), confirming the SQL
    aggregation is right, not hand-computed.
  - `POST /api/add-stock` as the **approver** cookie → `403 "Only a clerk
    can add stock."`.
  - `POST /api/add-stock` as clerk with `quantity: 0` → `400 "Quantity must
    be a positive whole number."`.
  - `POST /api/add-stock` as clerk with `{part: "BRAKE-PAD-Y", quantity:
    10}` → succeeds, creates `PO-3`/`DN-3`/`RC-3` — `PO-3` confirms the new
    counter seeding avoids colliding with seed `PO-1`/`PO-2`.
  - `GET /api/inventory` afterward → two lines, `BRAKE-PAD-Y` at 10 and
    `FILTER-X` still at 9, unaffected.
  - `GET /api/inventory` with no cookie → `401`.
  - `GET /inventory` with no cookie → `307` redirect to `/login` (proxy).
  - Re-ran `POST /api/reset` at the end to leave a clean demo state.

## Known gaps / open items

- Ledger assumes one part per delivery note, same as classification/
  reconciliation everywhere else in this prototype (§8's carried-over
  limitation) — not relaxed here.
- "Add new stock" has no upper bound on quantity and no duplicate-part
  merge UI beyond the ledger's own `SUM` (i.e. adding the same part twice
  just adds two receipts, which is correct behavior, not a bug, but worth
  knowing if it looks surprising in a demo).
- No alarm/threshold logic yet — that's phase 12 (§12, low-stock/rupture
  alarms over this ledger).
