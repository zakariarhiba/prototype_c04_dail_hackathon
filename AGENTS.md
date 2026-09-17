# AGENTS.md

Instructions for any agent (or human) working in this repo. This is the
root-level file for the whole project; `app/AGENTS.md` is a different,
Next.js-generated file scoped to the `app/` package only — do not confuse
the two or edit `app/AGENTS.md` by hand.

## Repo layout

- `context/` — the event's source material for case C04 (brief, interview
  template, seed data `initial.json`). **Do not edit.** Treat it as
  read-only ground truth for what the client asked for.
- `docs/` — our working docs: design, interview log, build log, evidence,
  handoff, presentation. This is what we write and keep current.
- `app/` — the Next.js prototype. A v1 already exists here; see "Phase
  discipline" below before adding to it.
- `TASKS.md` — the current task list. Check it before starting work.

## Phase discipline: design before build

We do not add or change application code before the relevant part of the
design is written down in `docs/01-system-design.md`. If you're about to
build something not covered there, stop and update the design doc first
(even a short paragraph), then build. If a build reveals the design was
wrong, fix `docs/01-system-design.md` and log why in `docs/03-build-log.md`
— don't let code and docs drift apart.

A v1 build already exists in `app/`. It is a reference for what worked
(data shapes, the classification heuristic), not a foundation we're
obligated to keep. `docs/01-system-design.md` says explicitly which parts of
v1 it's keeping and which it's reconsidering.

## Non-negotiable constraints (from the case brief)

- No supplier message, inventory update, or accounting entry is ever
  actually executed — everything downstream of a "write" is simulated and
  must say so in the UI.
- No write to state happens without an explicit human confirm/approve
  action. Ambiguous cases must not have a default/pre-selected answer.
- Any simulated input (a scan, an invoice, an event) must be visibly labeled
  as simulated in the UI, not presented as if it came from a real feed.
- Don't guess when the system is genuinely uncertain — surface the
  uncertainty and hand the decision to a human, with the reasoning stated.

## Keeping the repo understandable to a human who wasn't here

- Every doc in `docs/` should be readable on its own — link to the section
  of another doc it depends on rather than assuming the reader has read
  everything in order.
- The root `README.md` is the entry point for someone who just received the
  prototype: it should always reflect current run instructions and current
  real-vs-simulated status, not the state from an earlier iteration.
- Keep `TASKS.md` as the single source of truth for what's done, in
  progress, and not started — don't track task state only in chat history.
