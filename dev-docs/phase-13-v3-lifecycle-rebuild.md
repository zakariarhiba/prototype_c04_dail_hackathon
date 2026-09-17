# Phase 13 — v3: inventory master, QR, PO lifecycle, damage evidence

## What was asked

After phases 10-12 were validated (2026-09-17), Zakaria asked for a fuller
end-to-end demo scenario, walked start-to-finish in one continuous account:

1. Add a new part to an inventory master, with quantity, generating a QR
   code ticket for it.
2. When a PO comes in, the sender scans what they send (using the part's
   QR) and it moves automatically to the next phase.
3. A PO tracker view: each PO's history from creation until delivered,
   staying "open" if not fully resolved.
4. The receiving side confirms/scans what arrives as good or damaged; if
   damaged, the clerk must prove it with a photo or a description.
5. All of this working under **one account** for now — role separation
   (phase 10), accounts management, audit, security, more KPIs, and
   AI-assisted review are explicit next-phase work, not this one.

## Design decision made before building (per AGENTS.md "design before build")

`docs/01-system-design.md` §15 written first, scoping: a new `Part`
(inventory-master) entity with a generated QR payload; a PO lifecycle
status computed on read (**not** a stored column — corrected from this
section's first draft mid-write, once it was clear a stored column would
duplicate §11's ledger problem of a second write path that could drift;
logged inline in §15 and in `docs/03-build-log.md`); a sender-scan step
that reuses §4's `classifyScan` unchanged, just supplying its input from a
real Part+PO instead of the fixed scenario rotation; damage evidence
(text and/or an uploaded photo) required by the UI when `damaged > 0`; and
shelving (not deleting) §10's role gating for this pass. `TASKS.md` Phase 6
added listing this as its single dev-docs unit (originally sketched as five
separate phase numbers 16-20; collapsed to one phase doc since it was built
as one coherent session — see `TASKS.md`'s edit history).

## What changed

**`db/schema.sql`**:
- New `parts` table: `id, sku, name, description, quantity_on_hand,
  qr_payload, created_at`.
- `receipts` gains `damage_evidence_text text`, `damage_evidence_image
  text` (nullable, idempotent `alter table add column if not exists` for
  the already-running dev database). No `orders.status` column — status is
  computed, see below.

**`app/app/lib/types.ts`**: `Part`, `PoStatus`, `PoTimeline`,
`PoTimelineEvent` added. `Receipt` gains `damage_evidence_text` /
`damage_evidence_image`.

**`app/app/lib/store.ts`**:
- `listParts`, `addPart` (validates SKU/name/quantity, generates
  `qr_payload = JSON.stringify({type:"c04_part", id, sku})` — a prototype
  identifier, not a real GS1/barcode standard), `partQrDataUrl` (renders
  the payload to a PNG data URL via the `qrcode` package, computed fresh
  per request rather than stored).
- `simulateScanFromPart({part_id, order_id, listed_quantity})`: looks up
  the Part and Order, builds a `ScanScenario` from them, and calls the
  *same* `classifyScan` §4 already had — no duplicated or forked
  classification logic. Reuses the existing single-slot `pendingScan`
  mechanism, so the result lands on the Receiving page exactly like a
  fixed-scenario scan would.
- `confirmReceipt` now accepts `damage_evidence_text` /
  `damage_evidence_image` and throws before writing anything if
  `damaged > 0` and neither is present — enforced in the store (UI layer
  per §15), not at the DB.
- `getPoTimeline(orderId)` / `listPoTimelines()`: computed read-model.
  Status derivation: `closed` if any discrepancy notice exists for the PO;
  else `delivered` if accepted total ≥ ordered quantity; else `in_process`
  if any DN is logged; else `open`. Events (DN logged, notice approved)
  sorted by timestamp into one timeline.
- `resetState`'s truncate list gained `parts`.

**API routes**: `GET/POST /api/parts` (list with QR data URLs attached /
create), `POST /api/simulate-scan-part`, `GET /api/po` (list timelines),
`GET /api/po/[id]` (single timeline). `confirm-receipt`, `approve-notice`,
`add-stock` had their `session.role !== "..."` 403 checks removed (session
requirement stays) — this is the §15 "shelve, don't delete" role gating;
the `role` column, session payload, and per-route structure are unchanged,
just unenforced.

**Pages**: new `/parts` (add-part form, QR grid, outbound-scan trigger
that hands off to Receiving), new `/po` (status table) and `/po/[id]`
(timeline), nav links added to `app/(app)/layout.tsx` and `proxy.ts`'s
matcher. `/receiving` gained damage description/photo inputs (shown only
when `damaged > 0`, photo read client-side via `FileReader` to a data
URL — never uploaded to any external service) and displays stored evidence
in the delivery-notes table. Role-mismatch warning text/disabled-button
states removed from `/receiving`, `/invoices`, `/inventory` to match the
single-account scope.

**`package.json`**: added `qrcode` + `@types/qrcode` (pure-JS QR
generation, no native deps).

## How it was verified

- `npx tsc --noEmit` — clean, no type errors.
- Restarted `next dev`, confirmed `GET /` still 200.
- Logged in as `priya_lead` (clerk), `POST /api/reset`, then exercised the
  full chain by curl:
  - `POST /api/parts` → created `PART-1` (FILTER-X), response included a
    valid `qr_data_url` (`data:image/png;base64,...`).
  - `GET /api/parts` → listed it back with QR.
  - `GET /api/po` → `PO-1` correctly `in_process` (seed data: 9 of 10
    accepted, no notice yet), `PO-2` correctly `open` (nothing logged).
  - `POST /api/simulate-scan-part` with `PART-1`/`PO-2`/qty 5 → classified
    `NEW` (no existing DN for PO-2/that part), confirming `classifyScan`'s
    logic ran unmodified against real Part/PO input.
  - `POST /api/confirm-receipt` with `damaged: 2` and no evidence →
    correctly rejected: `"Damage reported but no evidence given..."`.
  - Same request with `damage_evidence_text` set → succeeded, `RC-3`
    stored with the text, `damage_evidence_image: null`.
  - `POST /api/simulate-invoice` then `POST /api/approve-notice` **while
    still logged in as the clerk account** → succeeded (previously 403'd
    before this phase), confirming role gating is shelved.
  - `GET /api/po/PO-1` after that approval → status flipped to `closed`,
    confirming the computed-status derivation picks up a newly approved
    notice with no separate write.
  - `POST /api/reset` again to leave the demo database in its clean seed
    state for Zakaria.

Not verified this pass: the actual browser UI (forms, QR image rendering
in `<img>`, the photo-upload `FileReader` path, the Receiving page's new
damage inputs) — only the API layer was curl-tested. Recommend a quick
click-through before the live demo, particularly the photo upload (data
URL size on a large photo could be worth capping, not done here).

## Known gaps / open items

- Photo evidence has no size limit — a large image is stored as-is in
  Postgres as a `text` data URL. Fine for a prototype demo, would need a
  real limit (or real object storage) beyond this.
- `Part.quantity_on_hand` is a starting count only, intentionally not kept
  in sync with §11's receipts-derived ledger (see §15's own note on why).
  The two numbers can legitimately diverge in the UI — worth calling out
  in the demo narrative so it doesn't read as a bug.
- Role gating shelving is global (every session, both seeded accounts) —
  there's no per-request "act as" switch; whoever is logged in can do
  everything, which is the point for this demo but means the login screen
  currently offers no visible signal that this changed from phase 10.
- No PO shows in the tracker until it exists in `orders` — `/parts`'
  outbound-scan PO dropdown only lists existing POs, there's no "create a
  new open PO" form yet (out of scope for this pass; "add new stock" on
  `/inventory` remains the only way to originate a brand-new PO+DN+Receipt
  in one step).

## Follow-up (same phase, 2026-09-17): browser click-through fixes

Zakaria clicked through the app after the API-level verification above and
found two issues, both fixed in this same phase doc per the root
AGENTS.md revision rule (no new phase number for a follow-up on the same
work):

1. **"About trast" looked like it signed the user out.** `app/app/page.tsx`
   (the `/` landing/about page) was a plain server component with a
   hardcoded "Log in" link, session-blind — it always looked like a logged-
   out state even when the session cookie was valid, because it never
   checked. Fixed by making it a client component using the existing
   `useSession()` hook: the header/hero CTA now reads "Back to dashboard"
   and links to `/dashboard` when a session is present, "Log in" only when
   it's genuinely absent. No actual session/cookie bug existed — this was
   a UI-only false signal.
2. **Landing/login background didn't read as trast's.** `/` used a flat
   `var(--color-bg)` with no brand treatment. Added a soft indigo radial-
   gradient wash (`rgba(69, 32, 209, 0.16)` fading to `var(--color-bg)`)
   behind the hero in `app/globals.css`'s `.landing-page` — matches §14's
   "clean, minimal, neutral background with indigo accent" description of
   the real trast.de rather than copying the login screen's separate dark
   gradient panel (a different, intentional visual choice for that
   screen's photo panel).

Then, on request, two more cosmetic-only changes (see
`docs/01-system-design.md` §14's own follow-up note for the full record):
the logo mark size increased (22-26px → 30-34px) on the login visual,
landing header, app topbar and app sidebar (it read too small), and the
visible wordmark on those same four surfaces changed from "trast" to
"Trast Dockline" (kept both names, per Zakaria's explicit correction after
an initial "dockline"-only pass). Text/sizing only — no logic touched, no
further change to internal identifiers (`docs/`, `dev-docs/`, DB/schema
comments still say "Dockline," per §14's original reskin-not-rename
decision).

**Verified**: `npx tsc --noEmit` clean after each change; `next dev`
restarted and `GET /` returned 200 after each round.
