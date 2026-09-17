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

Runs in parallel with Phase 5, not strictly after it — see
`dev-docs/phase-09-design-v2-auth-inventory-kpis.md` for the full
parallel-track plan.

- [x] Write the walkthrough script (`docs/06-presentation-script.md`):
      baby-step demo (exact pages/clicks against seeded data, no live
      typing needed for the core flow) plus a "what's next" roadmap
      section to talk to.
- [ ] Time the live walkthrough against the actual demo (not just read
      the script) and trim Part A if it runs long.
- [ ] Dry run once against the actual demo, not just the script.

## Phase 5 — v2: real auth, inventory ledger, alarms, KPIs

Design doc updated (§10-§13); awaiting Zakaria's sign-off before phase-10
code starts. See `dev-docs/phase-09-design-v2-auth-inventory-kpis.md`.

- [x] `docs/01-system-design.md` §10-§13 written (auth/session, inventory
      ledger, alarm thresholds, KPI definitions), §6 and §8 updated to
      match.
- [x] Phase 10: real auth/session (clerk vs approver), fixes the
      localStorage-only login bug and the unlinked clerk/approver name
      fields. Built and verified. Validated 2026-09-17 — see
      `dev-docs/phase-10-real-auth-session.md`. Role gating shelved for
      Phase 6 rebuild (single account, all access) — see Phase 6 below;
      not deleted, planned to come back once roles/accounts management is
      re-added.
- [x] Phase 11: inventory ledger (derived from receipts) + "add new stock"
      write. Built and verified. Validated 2026-09-17 — see
      `dev-docs/phase-11-inventory-ledger.md`. Superseded by Phase 6's
      real Part/inventory-master entity (this ledger was receipts-derived
      only, no standalone part record).
- [x] Phase 12: client-fit rebrand for hackathon-assigned client trast —
      indigo palette, "parts receiving lead"/"reconciliation lead"
      terminology, dashboard inventory link, then (same phase, escalated
      same day) trast's real logo/name on login+app shell in place of the
      generated "Dockline" mark, recolored raster art, simplified login
      credentials (`priya_lead`/`sam_lead`), and dev-facing simulation
      explanations consolidated onto the About page. Inserted out of the
      original sequence per a hackathon brief update 2026-09-17; bumped
      the phases below by one. Built and verified. Validated 2026-09-17 —
      see `dev-docs/phase-12-trast-client-fit.md`.
- [ ] Phase 14: low-stock/rupture alarms over the ledger. Deferred behind
      Phase 6 (needs the real Part entity first).
- [ ] Phase 15: KPIs (discrepancy rate, damage rate, time-to-reconcile).
- [ ] Phase 16 (optional/fold-in): relabel simulate-scan/invoice buttons as
      an explicit QR/barcode-trigger equivalent — folded into Phase 6's QR
      work (already partly covered by `/parts`' outbound-scan action).

## Phase 6 — v3: full lifecycle rebuild (inventory master, QR, PO tracking, damage evidence)

Design doc §15 written 2026-09-17; go-ahead given same day. Single-account
scope (role gating from Phase 5/§10 shelved, not deleted — re-added as a
later phase alongside audit/security/more KPIs/AI review automation, per
Zakaria).

- [x] `docs/01-system-design.md` §15 written (Part/inventory-master entity,
      QR code, PO status/lifecycle, sender-scan step, damage evidence,
      single-account shelving of §10 role gating). Status corrected to a
      computed read-model (not a stored column) before code, logged inline
      in §15 and in `docs/03-build-log.md`.
- [x] Phase 13: Part/inventory-master entity + "add new part" form + QR
      generation (`/parts`), PO status/lifecycle computed read-model + PO
      detail/timeline page (`/po`, `/po/[id]`), sender-scan step
      (`/api/simulate-scan-part`) feeding the existing classify/receive
      flow, damage evidence (text and/or photo, required when
      `damaged > 0`) on Receipt, and §10 role gating shelved (session
      still required, role check removed) for single-account demo. Built
      and verified — see `dev-docs/phase-13-v3-lifecycle-rebuild.md`.
      Awaiting Zakaria's review.

Explicit future work (post-hackathon, not this phase): re-add role
separation + accounts management, audit trail, security hardening, more
KPIs, AI-assisted review/automation of the reconciliation workflow.

Explicit future work (not built in this phase, goes into the Wolf handoff's
"next integration"): real scanner hardware, real supplier/accounting/EDI
integration, multi-user concurrency, multi-part DNs/partial invoices, auth
hardening (password reset/SSO/rate limiting), alarm-to-action workflow and
real notifications, configurable per-part thresholds, KPI history/trending.
