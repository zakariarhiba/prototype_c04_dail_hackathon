# C04 — Working Docs Overview

Event: Dail Octopus Day — Sept 17, 2026 — International University of Casablanca.

## Status

**We are restarting from design.** A first build already exists in `app/`
(delivery-note vs. invoice reconciliation, see its `README.md`), but we are
treating this as a v1 prototype to learn from, not the design to keep
building on. Before writing any more application code, we are designing the
system on paper: actors, data, states, decision points, and what a human
must approve. See `01-system-design.md`.

Read `../AGENTS.md` for how this repo is organized and the phase discipline
(design before build). Read `../TASKS.md` for the current task list.

## Challenge recap

**Client:** dealership parts receiving lead.
**Pain (their words, from `context/brief.md`):** "At the loading bay we need
to record what actually arrived. Later, someone tries to reconcile the
invoice. They cannot tell whether a difference was a shortage, a damaged
item, a duplicate scan or a second delivery."

**Data model (from `context/initial.json`):**
- One PO can be fulfilled by **multiple delivery notes** (partial/split deliveries).
- Each delivery note has a **receipt**: received / damaged / accepted, kept separate.
- One invoice can reference **multiple delivery notes**.
- Rule: one scan is not necessarily one new delivery.
- Rule: no stock or accounting write without human review.

This is a synthetic exercise — no real client, no real system, no real data.
`context/` is the event's source material and is not edited by us; see its
files for the original brief, interview template, and seed data.

## Docs in this folder

1. `01-system-design.md` — the system design: actors, entities, state
   machine, decision points, what's real vs. simulated. The main deliverable
   of the current phase.
2. `02-client-interview.md` — questions we'd ask a real client, and the
   assumptions we're making in their absence.
3. `03-build-log.md` — running log of what gets built and why, kept once
   building starts.
4. `04-evidence-and-failure-case.md` — the evidence view and at least one
   uncertain/failure case, filled in from the build.
5. `05-wolf-handoff.md` — next integration, access needed, owner,
   unresolved risk.
6. `06-presentation-script.md` — the pitch, timed.

## Deliverable checklist (from the brief)

- [ ] Working prototype / clickable demo with a repeatable start state
- [ ] Short record of the pain, client feedback, and what you changed after feedback
- [ ] An evidence view
- [ ] At least one uncertain or failure case
- [ ] README: run instructions, real vs. simulated, limitations, next validation test
- [ ] Wolf handoff: next integration, access needed, owner, unresolved risk

## Scored on

Speed · Creativity · Salesmanship · Confidence · Innovation. End the
presentation stating: what works, what is simulated, what you learned from
the client, and the next real case you'd test.
