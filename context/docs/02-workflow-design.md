# Phase 2 — Workflow Design

Fill this in AFTER the interview — confirm or revise the draft below.

## Narrow workflow (draft — confirm after interview)

A delivery note comes in → system checks it against an open PO and flags
"new delivery vs. possible duplicate scan" → clerk confirms received / damaged /
accepted → later, an invoice comes in → system reconciles the invoice quantity
against the SUM of accepted quantities across all linked delivery notes →
flags the exact discrepancy with its evidence chain (which DN, which receipt) →
a human approves the discrepancy notice before anything is "sent" (simulated).

## Confirmed workflow (after interview)


## Three paths to demonstrate (required by the brief)

**Ordinary path** (everything reconciles cleanly):


**Changed-information path** (new data arrives mid-demo — simulate-event button):


**Failure / uncertainty path** (system can't confidently decide, hands to human):


## Implementation Status (fill as you build — this feeds the Wolf handoff table)

| Component | Implemented or simulated? | Evidence / limitation |
|---|---|---|
| Input / event trigger | | |
| Retrieval / reasoning | | |
| Human review | | |
| External action | | |
| Persistence / history | | |
