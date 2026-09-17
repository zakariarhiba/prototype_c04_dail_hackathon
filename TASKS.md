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
- [x] Decide: keep the Next.js app shell from v1, or restart the app from
      scratch against the new design? Decision: keep the Next.js shell,
      restyled to match the mandated design system (see
      `docs/01-system-design.md` §9 and the build log).
- [ ] Resolve or explicitly time-box the open questions in
      `docs/01-system-design.md` §7 — each one needs either a real answer or
      a stated assumption before build starts.
- [x] Record the event's mandated tool stack (Claude Code, Next.js,
      LangGraph, Python, Supabase, Gemini) and how deep each is integrated —
      `docs/01-system-design.md` §9.
- [ ] Sign off: design doc reviewed, ready to move to Phase 2.

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

Not started.

- [ ] Write and time the 3-minute script (`docs/06-presentation-script.md`).
- [ ] Dry run once against the actual demo, not just the script.
