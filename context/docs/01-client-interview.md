# Phase 1 — Requirements Extraction (no live client chat)

Confirmed with organizers: there is no live client conversation for this
exercise — everything the "client" says is in brief.md / docs/c04, already
read. "Interview the client" means: extract what's stated as fact, and be
explicit about what you're assuming beyond it.

## What's an established fact (from the client's own words + initial.json)

- The pain is real and specific: at receiving, they log what arrived; later,
  someone reconciles the invoice; they currently cannot tell if a difference
  is a shortage, a damaged item, a duplicate scan, or a second delivery.
- One PO can be fulfilled by multiple delivery notes (partial/split delivery
  is a normal occurrence, not an edge case).
- Received / damaged / accepted quantities must be tracked separately.
- One scan is not necessarily one new delivery (duplicate-scan risk is named
  explicitly as a rule, not just implied).
- No stock or accounting write happens without human review.
- All documents are synthetic; scanned-document input can be simulated but
  must be clearly labeled as such.

## What we're assuming (state these openly in the demo — don't hide them)

- Who currently does the reconciliation (receiving vs. accounting) — assumed,
  not stated.
- What "resolving" a mismatch looks like today (call the supplier? credit
  note? nothing?) — assumed.
- Which mismatch type is costliest to the business — assumed; we're choosing
  to treat all three (shortage, uncredited damage, duplicate billing) as
  worth flagging, not picking one to prioritize based on real evidence.
- How urgently a flagged discrepancy needs a response — assumed same-day.

## What this means for the plan

Skip waiting on client answers — go straight to Phase 2 (workflow design)
using the facts above, and carry the assumptions list into the demo and the
Wolf handoff ("what remains an assumption"). The "next real case we'd test"
in the handoff is where the real, unanswered questions go — that's the
validation step you'd actually want with a live client, and naming it well
is what shows Confidence.
