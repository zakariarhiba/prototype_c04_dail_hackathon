# Trast Dockline — Delivery Note / Invoice Reconciliation Prototype

Synthetic exercise (Dail Octopus, case C04), built for hackathon-assigned
client trast. "Dockline" is this prototype's internal/working product name
(used throughout `docs/`/`dev-docs`/DB); visible brand surfaces (login,
landing, topbar, sidebar) read "Trast Dockline." "C04" is the exercise's own
case reference. Not a real client system, not connected to anything real.
See `context/` for the source-of-truth brief, interview notes, and test
data — that directory is not modified by the prototype.

> **Status:** v3 build (phase 13, awaiting review) — real auth/session,
> inventory ledger, a Part/QR inventory master, a computed PO lifecycle
> tracker, and required damage evidence, all under a single demo account
> (role separation exists in the code but is currently shelved — see
> `docs/01-system-design.md` §15). See `docs/01-system-design.md` for the
> full design and `TASKS.md` for what's in progress/next. Read `AGENTS.md`
> first if you're picking up work here.

## What this is

The client's pain: at the loading bay they record what arrived; later
someone reconciles the invoice and cannot tell whether a difference is a
shortage, a damaged item, a duplicate scan, or a second delivery.

This prototype demonstrates one narrow slice of that workflow, end to end,
with a human confirming every write:

1. **Receiving** (`/receiving`) — simulate an incoming delivery-note scan.
   The system checks it against open POs and flags **new vs. duplicate**
   with a stated reason. The parts receiving lead confirms/corrects
   received/damaged/accepted quantities and confirms/corrects the flag.
   Nothing is written to state until they confirm. One scenario is
   genuinely ambiguous and the system refuses to guess, handing the decision
   to them instead.
2. **Invoice reconciliation** (`/invoices`) — simulate an incoming invoice
   for the PO. The system reconciles the invoiced quantity against the
   **sum of accepted quantities** (not received) across every delivery note
   logged for that PO, and shows a line-by-line evidence trail for any
   mismatch (e.g. "1 unit damaged and rejected on DN-1, not credited on the
   invoice"). A human must approve before a discrepancy notice is generated;
   the notice is simulated and displayed only, never sent.
3. **Inventory ledger** (`/inventory`) — "received-to-date by part," summed
   live from accepted receipts (never called "stock on hand" — this
   prototype has no putaway/pick/consumption events). Can also "add new
   stock": a real write of a new order/delivery-note/receipt for a
   part/quantity typed on the spot.
4. **Parts & QR** (`/parts`) — a real inventory-master ("Part") entity:
   add a part with a SKU/name/quantity and get a generated QR code
   (prototype identifier only, not a real GS1/barcode standard). "Simulate
   outbound scan" scans a part's QR against an open PO, feeding the same
   classify/confirm flow as Receiving above.
5. **PO tracker** (`/po`, `/po/[id]`) — every PO's status
   (`open`/`in_process`/`delivered`/`closed`), computed live from its
   delivery notes, receipts and any approved discrepancy notice — never a
   separate flag to drift out of sync. A PO stays open/in-process
   indefinitely if never fully resolved. The detail page shows one PO's
   full timeline, created through resolution.

Damage evidence: on Receiving, confirming a receipt with `damaged > 0`
requires a description and/or an uploaded photo before it can be saved —
the photo never leaves this prototype (stored as a data URL, not sent
anywhere).

**Single account for this demo**: `docs/01-system-design.md` §10's real
clerk-vs-approver role gating exists in the code (session, `role` column,
per-route structure) but is currently unenforced — either seeded account
can do everything. This is a deliberate, reversible simplification for a
one-account walkthrough demo, not a security fix; see §15 for why and
`TASKS.md` for when role separation comes back.

## Run instructions

```bash
# 1. Postgres (real persistence, see "Data flow" below)
docker compose up -d

# 2. The app
cd app
npm install   # already run once during the build; safe to skip if node_modules exists
cp .env.local.example .env.local   # DATABASE_URL, already points at the compose Postgres
npm run dev
```

Open `http://localhost:3000` — a public landing/about page. "Log in" is a
real signed-cookie session against two seeded demo users (see "Real vs.
simulated" below): `priya_lead` / `@Passw0rd1` (parts receiving lead) and
`sam_lead` / `@Passw0rd2` (reconciliation lead). A successful login takes
you to `/dashboard`, and a 3D
loading intro plays on the way in. Use "Reset to seed state" on any page to
truncate and reseed the database (including the two demo users) from
`context/initial.json` for a repeatable demo start — this endpoint is
deliberately not session-gated, since it's also how a fresh database gets
its first logins.

## Data flow

- Seed data (`PO-1`, `DN-1`, `DN-2`, their receipts) is read read-only from
  `context/initial.json` and loaded into Postgres on `POST /api/reset`.
- Confirmed state after that (new delivery notes, receipts,
  discarded-duplicate log, discrepancy notices) is written to Postgres
  (`db/schema.sql`, via `app/app/lib/store.ts` and `app/app/lib/db.ts`) and
  survives a server restart.
- A **pending** scan or invoice (the system's proposal, before a human
  confirms/approves it) is deliberately kept in memory only, not in
  Postgres — per the design's "nothing is written before confirmation"
  rule, it isn't state yet.
- `app/app/lib/store.ts` holds all the actual classification and
  reconciliation logic. It is the file to read to see exactly what is
  "real" here.
- The schema is plain Postgres (no Supabase-specific features), on purpose
  — moving to an actual Supabase project later is a `DATABASE_URL` change
  plus re-running `db/schema.sql`, not a rewrite. See
  `docs/01-system-design.md` §9.
- A Python/LangGraph + Gemini narrative service exists (`narrative-service/`)
  but is **not currently wired in** — paused per "no LLM for now, it's just
  a prototype." See its own README if you want to reconnect it.

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
- Login/session (`app/app/lib/auth.ts`, `session.ts`, `store.ts`): a signed,
  HTTP-only cookie set on a real credential check against the seeded
  `users` table (PBKDF2-hashed demo passwords). See `docs/01-system-design.md`
  §10. Not real *identity* verification — no password policy, recovery
  flow, rate limiting, or OAuth/SSO; see "Limitations" below.
  **Role gating currently shelved (§15, phase 13):** §10's `role=clerk`/
  `role=approver` per-route checks are still in the code but not enforced
  — any authenticated session can confirm-receipt, approve-notice, add
  stock, or add a part. A deliberate, reversible single-account demo
  simplification, not a real permission model right now.
- Part / inventory master + QR (`listParts`/`addPart`/`partQrDataUrl` in
  `store.ts`, §15): a real Part record with a generated QR payload. Its
  `quantity_on_hand` is a starting count set at creation only — deliberately
  **not** kept in sync with the inventory ledger below, to avoid two write
  paths fighting over one number; the two can legitimately diverge.
- PO lifecycle (`getPoTimeline`/`listPoTimelines` in `store.ts`, §15): status
  and timeline computed fresh from orders/delivery_notes/receipts/
  discrepancy_notices on every read — same drift-avoidance approach as the
  inventory ledger, never a stored status column.
- Damage evidence gate (`confirmReceipt` in `store.ts`, §15): confirming a
  receipt with `damaged > 0` and no description/photo is rejected before
  anything is written.
- Inventory ledger (`getInventoryLedger` in `store.ts`): `SUM(receipts.accepted)`
  grouped by part, computed fresh on every read (a query, not a maintained
  counter), never allowed to drift from the receipts it's built from. See
  `docs/01-system-design.md` §11 for why it's "received-to-date," not a
  real stock count.
- "Add new stock" (`addNewStock` in `store.ts`): a real write of a new
  order/delivery-note/receipt from a clerk-entered part/quantity — but only
  to this app's own tables, never to a real supplier or inventory system.

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
- The "simulate outbound scan" event on `/parts`: no real scanner/camera —
  a QR is picked from a dropdown, not read from a lens. The QR itself is a
  prototype-only identifier, not a real GS1/barcode standard.
- The damage photo uploaded on Receiving: stored as a data URL in this
  app's own database, never filed with a real supplier claim.
- The 3D loading intro is cosmetic. Login itself is real (see above) — the
  clerk/approver name shown throughout the app comes from the session, not
  free text.

## Limitations

- Real Postgres persistence for confirmed state, but no production
  hardening — single instance, no migrations tooling, no multi-user
  concurrency handling, reset truncates and reseeds rather than
  versioning data.
- Classification heuristic is intentionally simple (exact-quantity /
  PO-coverage matching). It has not been validated against real scan data,
  OCR noise, partial barcodes, or suppliers who split differently than this
  dataset assumes.
- Real session enforcement (§10 above), but only two demo credentials
  exist, seeded by reset — no self-service signup, password policy,
  recovery flow, rate limiting, or OAuth/SSO. Anyone with a valid demo
  password can act as that role.
- Only one part/PO shape is exercised in depth (`FILTER-X` on `PO-1`, plus
  the demo-added `PO-2`); multi-line delivery notes, multiple parts per DN,
  and partial invoices are not modeled. The inventory ledger inherits this:
  it assumes one part per delivery note.
- Role separation (clerk vs. approver) is currently shelved for a
  single-account demo (see above) — not a real access-control gap to fix,
  a deliberate temporary state; re-enabling it, plus real accounts
  management, audit trail, and rate limiting, is explicit next-phase work.
- Damage-evidence photos have no size limit — stored as-is as a `text`
  data URL in Postgres. Fine for a prototype demo; would need a real cap
  or object storage for anything beyond that.

## Next validation test

Before trusting the duplicate-detection heuristic on a real loading bay: run
it against a week of real (or realistically messy) scan logs from one
dealership and check the false-positive/false-negative rate on genuine
duplicate scans vs. legitimate back-to-back split deliveries — this is
exactly the case the heuristic is weakest on (see `AMBIGUOUS` path).

See `docs/05-wolf-handoff.md` for the fuller handoff (next integration,
access needed, owner, unresolved risk) and the rest of `docs/` for the
working log kept during the build.
