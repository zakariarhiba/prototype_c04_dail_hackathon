# Phase 6 — 3-Minute Presentation Script

Show the result FIRST. State plainly what's demonstrated vs. what's a hypothesis.

## Timing budget (3:00 total)

**0:00–0:30 — Show the result first**
Open on `/receiving` already loaded. Click "Simulate incoming delivery
note" live — don't explain first, show the flag appear.

**0:30–1:15 — The problem, in the client's language**
"At the loading bay you record what arrived. Later someone reconciles the
invoice and can't tell if a gap is a shortage, a damaged unit, a duplicate
scan, or a second delivery." Point at `initial.json`'s shape: one PO, two
delivery notes, receipts that separate received/damaged/accepted — that
separation is the whole feature, and duplicate-scan risk is stated as a
named rule, not an edge case.

**1:15–2:30 — Demo walkthrough**
Ordinary path: simulate on `/receiving` → NEW flag on demo PO `PO-2` →
confirm as clerk. Then `/invoices` → simulate → show a clean reconciliation.
Changed-information: go back to `/receiving`, simulate again → DUPLICATE
flag against `DN-1`, confirm as duplicate, show it logged to the audit
table instead of creating a new record. Failure/uncertain: simulate a third
time → AMBIGUOUS, no pre-selected answer, walk through why (quantity
doesn't match either logged DN, but the PO already shows fully covered) and
let the clerk decide. Then `/invoices` → simulate the mismatch scenario →
point at the evidence line naming DN-1's damaged unit exactly.

**2:30–2:50 — What's real vs. simulated**
Real: the classification and reconciliation logic, computed from live
state every time. Simulated: the scan/invoice arrival itself (buttons, no
real scanner or feed) and the discrepancy notice (generated, never sent).

**2:50–3:00 — Close**
No live client conversation was available for this exercise, so what we
learned came from taking `initial.json` and the stated rules literally —
in particular, that the seed data itself already fully accounts for the
only real PO, which is exactly the kind of state a real duplicate-detector
has to handle correctly, not just the tidy cases. Next real test: run this
against a week of a real dealership's actual scan logs and measure how
often the clerk agrees with the system's call.

## Anticipated objections + your answers

**"How do you know it's a duplicate scan and not a real second delivery?"**
We don't claim certainty — we claim a stated, inspectable reason every
time. When the evidence is ambiguous (quantity doesn't match anything
logged, but the PO already looks fully covered), the system says so
explicitly and refuses to pick for the clerk. It only calls DUPLICATE with
high confidence when there's an exact quantity match against an existing
delivery note and the PO is already fully accounted for.

**"What if the reconciliation is wrong?"**
It's not a model guess — it's arithmetic over records a human already
confirmed at receiving (accepted quantity, not received quantity, is the
number of record). If a receipt was confirmed wrong, that's a clerk-input
error to fix at the source, and it's visible in the evidence table, not
hidden inside a black-box total.

**"What would it take to actually connect this to our systems?"**
Read access to the dealership's PO/delivery-note system and invoicing
system, a durable store instead of this prototype's in-memory state, and
validation against a real week of scan data before trusting the
duplicate-vs-new call unsupervised. See `docs/05-wolf-handoff.md`.
