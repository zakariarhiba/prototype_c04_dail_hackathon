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
- `dev-docs/` — one file per unit of coding work ("dev phase"), written for
  a human reviewer who wasn't in the chat. See "Dev-docs and phase-gate
  workflow" below — **read this before writing any code.**
- `app/` — the Next.js prototype. A v1 already exists here; see "Phase
  discipline" below before adding to it.
- `narrative-service/` — Python/LangGraph/Gemini service. Built, currently
  paused (not called by the app) — see `dev-docs/phase-03-*.md` before
  touching it.
- `TASKS.md` — the current task list. Check it before starting work.

## Dev-docs and phase-gate workflow

Every unit of coding work (a "dev phase" — see `dev-docs/README.md` for
what counts as one) follows this loop, no exceptions:

1. **Before writing code**, know which dev phase this is and what its scope
   is. If it's genuinely new scope, give it the next number.
2. **Write the code.**
3. **Verify it yourself** — type-check, run it, exercise the actual
   behavior (curl the API, click through the UI, whatever proves it works),
   not just "it compiles." Fix what verification finds before moving on.
4. **Write `dev-docs/phase-NN-<slug>.md`** documenting: what was asked,
   what changed (files + why), how it was verified (the actual commands/
   checks run and their results, including any bugs found and fixed along
   the way), and known gaps/open items. Add it to the index table in
   `dev-docs/README.md`.
5. **Stop and report to Zakaria.** Tell him the phase is done and where the
   doc is. Do not start the next dev phase's code until he explicitly
   validates this one (a clear "yes", "approved", "go ahead", etc. — not
   silence, not an unrelated reply, not you assuming approval because the
   work looks right to you).
6. If he asks for changes, make them, update the same phase doc in place
   (don't create a new phase number for a revision of the same work), and
   return to step 5.

This applies to every agent working in this repo, not just whoever is
active when this rule was added. If you pick up work here and the most
recent `dev-docs/phase-NN-*.md` doesn't have an explicit validation from
Zakaria recorded (or referenced) in the conversation, treat it as awaiting
review — don't build on top of it as if it were approved, and don't start
a new phase until it's resolved. When in doubt about whether something
counts as a new phase or a continuation of the current one, ask.

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
