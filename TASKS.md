# TASKS.md

Single source of truth for what's done, in progress, and not started. Update
this as work happens; don't let status live only in chat history. One task
"in progress" at a time within a phase where possible.

## Phase 1 — Design (current phase)

- [x] Write the system design (`docs/01-system-design.md`): actors,
      entities, state machine, classification and reconciliation logic,
      real-vs-simulated split.
- [x] Log client-interview questions and the assumptions we're using in
      place of real answers (`docs/02-client-interview.md`).
- [x] Review v1's `app/app/lib/store.ts` line by line against
      `docs/01-system-design.md` and note every place they diverge. Result:
      no divergence found. `classifyScan` (store.ts:199-270) matches §4's
      heuristic exactly (no-DN→NEW, exact-match+PO-covered→DUPLICATE,
      exact-match+PO-not-covered→AMBIGUOUS, overshoot→AMBIGUOUS,
      else→NEW). `simulateIncomingInvoice`/reconciliation (store.ts:411-466)
      matches §5: sums `accepted` (not `received`) per DN, builds one
      evidence line per DN. The confirm/approve gates (store.ts:312-380,
      474-517) match §3: nothing is written to Postgres until
      `confirmReceipt`/`approveDiscrepancyNotice` is called. The one design
      area store.ts correctly does *not* implement — real auth — was §8's
      explicit non-goal in v1; see §10 for v2's change to that.
- [x] Decide: keep the Next.js app shell from v1, or restart the app from
      scratch against the new design? Decision: keep the Next.js shell,
      restyled to match the mandated design system (see
      `docs/01-system-design.md` §9 and the build log).
- [x] Resolve or explicitly time-box the open questions in
      `docs/01-system-design.md` §7 — each one needs either a real answer or
      a stated assumption before build starts. Resolution: no real client
      to ask (per `context/brief.md`), so all six stay as the stated
      assumptions already logged in `docs/02-client-interview.md` — time-
      boxed as "assumption stands until real data/feedback contradicts it,"
      not re-litigated per build phase.
- [x] Record the event's mandated tool stack (Claude Code, Next.js,
      LangGraph, Python, Supabase, Gemini) and how deep each is integrated —
      `docs/01-system-design.md` §9.
- [x] Sign off: design doc reviewed, ready to move to Phase 2. v2 addendum
      (§10-§13: auth/session, inventory ledger, alarms, KPIs) added
      2026-09-17, pending Zakaria's explicit go-ahead before phase-10 code
      starts — see `dev-docs/phase-09-design-v2-auth-inventory-kpis.md`.

## Phase 2 — Build

Started ahead of formal Phase 1 sign-off (UI restyle + tool-stack decision
already in progress) — remaining Phase 1 items above still need closing out.

- [x] Implement entities and state per `docs/01-system-design.md` §2 —
      Postgres (`db/schema.sql`), confirmed state persisted, pending
      scan/invoice kept in memory by design.
- [x] Implement classification (`NEW` / `DUPLICATE` / `AMBIGUOUS`) per §4.
- [x] Implement reconciliation (accepted-quantity sum + evidence lines) per §5.
- [x] Implement the human confirm/approve gates — no write without them.
- [ ] Label every simulated input/output in the UI (login, incoming scan/
      invoice buttons, discrepancy notice — audit which are still missing
      the label).
- [x] Build the Python/LangGraph + Gemini narrative service
      (`narrative-service/`) — built, then paused per "no LLM for now, it's
      just a prototype." Not called by the app currently; see
      `docs/01-system-design.md` §9.
- [ ] Log each significant event in `docs/03-build-log.md` as it happens.

## Phase 3 — Evidence, failure case, and handoff

Not started.

- [ ] Capture the evidence view and at least one uncertain/failure case in
      `docs/04-evidence-and-failure-case.md`.
- [ ] Write the Wolf handoff (`docs/05-wolf-handoff.md`): next integration,
      access needed, owner, unresolved risk.
- [ ] Update root `README.md` to match the final build: run instructions,
      real vs. simulated, limitations, next validation test.

## Phase 4 — Presentation

Not started. Runs in parallel with Phase 5, not strictly after it — see
`dev-docs/phase-09-design-v2-auth-inventory-kpis.md` for the full
parallel-track plan.

- [ ] Write and time the 3-minute script (`docs/06-presentation-script.md`).
- [ ] Dry run once against the actual demo, not just the script.

## Phase 5 — v2: real auth, inventory ledger, alarms, KPIs

Design doc updated (§10-§13); awaiting Zakaria's sign-off before phase-10
code starts. See `dev-docs/phase-09-design-v2-auth-inventory-kpis.md`.

- [x] `docs/01-system-design.md` §10-§13 written (auth/session, inventory
      ledger, alarm thresholds, KPI definitions), §6 and §8 updated to
      match.
- [x] Phase 10: real auth/session (clerk vs approver), fixes the
      localStorage-only login bug and the unlinked clerk/approver name
      fields. Built and verified; awaiting Zakaria's review — see
      `dev-docs/phase-10-real-auth-session.md`.
- [x] Phase 11: inventory ledger (derived from receipts) + "add new stock"
      write. Built and verified; awaiting Zakaria's review — see
      `dev-docs/phase-11-inventory-ledger.md`.
- [x] Phase 12: client-fit rebrand for hackathon-assigned client trast —
      indigo palette, "parts receiving lead"/"reconciliation lead"
      terminology, dashboard inventory link, then (same phase, escalated
      same day) trast's real logo/name on login+app shell in place of the
      generated "Dockline" mark, recolored raster art, simplified login
      credentials (`priya_lead`/`sam_lead`), and dev-facing simulation
      explanations consolidated onto the About page. Inserted out of the
      original sequence per a hackathon brief update 2026-09-17; bumped
      the phases below by one. Built and verified; awaiting Zakaria's
      review — see `dev-docs/phase-12-trast-client-fit.md`.
- [ ] Phase 13: low-stock/rupture alarms over the ledger.
- [ ] Phase 14: KPIs (discrepancy rate, damage rate, time-to-reconcile).
- [ ] Phase 15 (optional/fold-in): relabel simulate-scan/invoice buttons as
      an explicit QR/barcode-trigger equivalent — cosmetic only.

Explicit future work (not built in this phase, goes into the Wolf handoff's
"next integration"): real scanner hardware, real supplier/accounting/EDI
integration, multi-user concurrency, multi-part DNs/partial invoices, auth
hardening (password reset/SSO/rate limiting), alarm-to-action workflow and
real notifications, configurable per-part thresholds, KPI history/trending.
