# Phase 9 — Design doc update: v2 auth, inventory ledger, alarms, KPIs

**Status: awaiting review**

## What was asked

Zakaria noted the app currently only exposes two screens (receiving,
invoice reconciliation), that login appears broken (types a name, no real
session), and asked for a much stronger prototype: real functionality
toward "80% automated, human reviews/approves the rest" — including, in his
initial framing, a real scanner/QR hardware integration for tracking
inventory, plus stock alarms and KPIs. He then asked for a full execution
plan covering both what to build now and what to explicitly defer, run in
parallel with presentation prep.

Before planning, pushed back on real scanner/QR hardware: `context/brief.md`
mandates simulated, labeled scan/invoice events only ("a button that
explicitly simulates an incoming event is acceptable... call it a
simulation"), and there's no hardware budget/time for this exercise.
Zakaria agreed to drop hardware and build everything else in-app.

This phase is the first step of that plan: update
`docs/01-system-design.md` before any app code, per `AGENTS.md`'s
design-before-build rule. No application code changed in this phase.

## What changed

- `docs/01-system-design.md`:
  - §6 (real-vs-simulated table): added a "Real as of v2" block listing
    auth/session, inventory ledger, alarms, and KPIs as real, distinguishing
    each from the still-simulated scan/invoice/notice-delivery events.
  - §8 (non-goals): removed "no real authentication" (superseded by new
    §10), with an inline note on what's still *not* built (password
    recovery, SSO, rate limiting, audit logging).
  - New §10 Auth/session model: two roles (`clerk`, `approver`), a new
    `users` table seeded by `resetState()`, signed HTTP-only cookie
    session, role-gated API routes (403 on mismatch), explicit statement
    that this is session enforcement, not identity verification. Also
    documents the root cause of the "login not working" report: v1's
    `localStorage`-only login had no server session and no route
    protection, and separately, the typed-in name never flowed into the
    `clerk_name`/`approved_by` fields on the workflow screens (three
    unlinked pieces of client state).
  - New §11 Inventory ledger: `InventoryLedgerLine` (part,
    on_hand_accepted, last_movement_at), derived via
    `SUM(receipts.accepted)` grouped by part, computed on read (not a
    separate mutable counter). Explicitly labeled "received-to-date," not
    "stock on hand," since there's no putaway/pick/consumption model
    behind it. "Add new stock" scoped as a real write to this app's own
    `orders`/`delivery_notes` only.
  - New §12 Alarm thresholds: percentage-of-PO-quantity rule, computed and
    displayed only — no notification channel, explicitly not an "action."
  - New §13 KPI definitions: discrepancy rate, damage rate, and
    time-to-reconcile (scoped down to approve-click-to-notice, since
    `PendingInvoiceReview` is deliberately in-memory-only per §3/§9 and
    adding a durable "invoice arrived" timestamp just for this KPI was
    judged not worth breaking that design — flagged as future work
    instead).
- `TASKS.md`:
  - Closed the two outstanding Phase 1 checkboxes (store.ts-vs-design
    line-by-line review; sign-off) — see verification below for the review
    result.
  - Closed the §7 open-questions checkbox with an explicit "no real client
    to ask, assumptions stand" resolution rather than leaving it open
    indefinitely.
  - Added Phase 5 (v2: auth/ledger/alarms/KPIs, phases 10-14) and noted
    Phase 4 (presentation) runs in parallel with it.
- `docs/03-build-log.md`: added Event 1 documenting the scope discussion,
  the hardware pushback, and why the agreed features don't violate the
  brief's non-negotiable "no real external write" constraint.

## Why

`AGENTS.md`'s design-before-build rule: don't add app code for something
not yet in `docs/01-system-design.md`. All four new sections exist so the
next four build phases (10-13, real auth / inventory ledger / alarms /
KPIs) have a written design to build against and Zakaria to review, rather
than being improvised during implementation. Full phased plan (build
sequence, verification per phase, explicit future-work list, parallel
presentation track) is captured in the approved plan file for this
conversation; TASKS.md Phase 5 is the durable summary of it.

## How it was verified

- Read `app/app/lib/store.ts` in full and confirmed the store.ts-vs-design
  review claim in `TASKS.md`: `classifyScan` (lines 199-270) matches §4's
  heuristic exactly, `simulateIncomingInvoice` (411-466) matches §5, and
  the confirm/approve gates (312-380, 474-517) match §3 — no divergence.
- Read the whole current `docs/01-system-design.md`, `TASKS.md`,
  `docs/02-client-interview.md`, `docs/03-06` stub docs, `context/brief.md`,
  and `context/initial.json` before writing, to ground every new section in
  what already exists rather than inventing new entities that conflict.
- Cross-checked the login bug claim against the actual code: confirmed via
  `app/app/login/page.tsx`, `app/app/(app)/layout.tsx`,
  `app/app/receiving/page.tsx`/`invoices/page.tsx` (via a code-inventory
  pass) that there's no `middleware.ts`, no cookie, and that
  `clerkName`/`approverName` are separate `useState` defaults
  ("Clerk on duty" / "Accounting clerk on duty") never populated from the
  login name.
- This is a docs-only change — no `tsc`/`eslint`/dev-server run applies.
  Verification for the doc itself: read it back end-to-end for internal
  consistency (§6/§8/§10-13 cross-references resolve to real section
  numbers, no orphaned references).

## Known gaps / open items

- §13's time-to-reconcile KPI is intentionally narrow (approve-click to
  notice, not invoice-arrival to notice) — if that's unsatisfying for the
  demo, the alternative (add a durable "invoice pending" timestamp) is
  flagged as future work, not silently done differently at implementation
  time.
- §12's alarm threshold (percentage of original PO quantity) is a
  hackathon-time simplification; a real per-part configurable threshold
  is explicit future work, not built here.
- This phase does not touch `app/` at all — phases 10-14 (real auth,
  inventory ledger, alarms, KPIs, optional QR-trigger relabel) are the next
  units of work, each gated on this design doc being signed off first, and
  each other in sequence per `AGENTS.md`.
