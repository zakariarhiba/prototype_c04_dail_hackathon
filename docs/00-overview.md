# C04 — Working Docs Overview

Event: Dail Octopus Day — Sept 17, 2026 — International University of Casablanca
Build window: 11:00–18:00 · Presentations: 18:00–19:00 · Winners: 20:00

## Challenge recap

**Client:** dealership parts receiving lead.
**Pain (their words):** "At the loading bay we need to record what actually arrived.
Later, someone tries to reconcile the invoice. They cannot tell whether a difference
was a shortage, a damaged item, a duplicate scan or a second delivery."

**Data model (from initial.json):**
- One PO can be fulfilled by **multiple delivery notes** (partial/split deliveries)
- Each delivery note has a **receipt**: received / damaged / accepted, kept separate
- One invoice can reference **multiple delivery notes**
- Rule: one scan is not necessarily one new delivery
- Rule: no stock or accounting write without human review

## Phases (this folder)

1. `01-client-interview.md` — questions to ask + where to log answers
2. `02-workflow-design.md` — the narrow workflow, confirmed after the interview
3. `03-build-log.md` — running log of what you build/prompt in the harness + how you react to changed info
4. `04-evidence-and-failure-case.md` — the evidence view + one uncertain/failure case
5. `05-wolf-handoff.md` — the official handoff doc, filled in as you go
6. `06-presentation-script.md` — your 3-minute pitch, timed

## Deliverable checklist (from the brief — don't leave the venue without these)

- [ ] Working prototype / clickable demo with a repeatable start state
- [ ] Short record of the pain, client feedback, and what you changed after feedback
- [ ] An evidence view
- [ ] At least one uncertain or failure case
- [ ] README: run instructions, real vs. simulated, limitations, next validation test
- [ ] Wolf handoff: next integration, access needed, owner, unresolved risk

## Scored on (scorecard.md)

Speed · Creativity · Salesmanship · Confidence · Innovation
End the presentation stating: what works, what is simulated, what you learned from
the client, and the next real case you'd test.
