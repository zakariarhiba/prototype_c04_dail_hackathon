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
- [ ] Review v1's `app/app/lib/store.ts` line by line against
      `docs/01-system-design.md` and note every place they diverge.
- [ ] Decide: keep the Next.js app shell from v1, or restart the app from
      scratch against the new design? Record the decision and why.
- [ ] Resolve or explicitly time-box the open questions in
      `docs/01-system-design.md` §7 — each one needs either a real answer or
      a stated assumption before build starts.
- [ ] Sign off: design doc reviewed, ready to move to Phase 2.

## Phase 2 — Build

Not started. Do not start until Phase 1 is signed off.

- [ ] Implement entities and state per `docs/01-system-design.md` §2.
- [ ] Implement classification (`NEW` / `DUPLICATE` / `AMBIGUOUS`) per §4.
- [ ] Implement reconciliation (accepted-quantity sum + evidence lines) per §5.
- [ ] Implement the human confirm/approve gates — no write without them.
- [ ] Label every simulated input/output in the UI.
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

Not started.

- [ ] Write and time the 3-minute script (`docs/06-presentation-script.md`).
- [ ] Dry run once against the actual demo, not just the script.
