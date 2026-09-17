# Build Log

Not started. This fills in once we start building against
`01-system-design.md`. Log entries as they happen, in the order they
happen — each entry is one event: something changed (a design decision, a
piece of feedback, new information from `context/`), and what we did about
it.

## Format for each entry

```
### Event N — <short title>

What happened / what changed:

What we did in response:

Why (link back to a design-doc section or interview answer if relevant):
```

### Event 1 — v2 scope agreed, design doc extended

What happened / what changed: Zakaria observed the app only exposes
receiving + invoice reconciliation, that login is broken (types a name but
nothing enforces a session), and asked for a stronger prototype — auth,
inventory tracking, low-stock alarms, KPIs — describing an ambition toward
"80% automated, human reviews/approves the rest." Initial framing included
real scanner/QR hardware.

What we did in response: pushed back on hardware — out of the brief's
scope (simulated, labeled scan/invoice events only) and no time/budget for
it here. Agreed a scoped v2: real auth/session (clerk vs approver), an
inventory ledger derived from confirmed receipts (not a new external
write), low-stock alarms over that ledger (display-only, no notification
channel), and KPIs computed live from Postgres. Investigated the login bug
directly: it's `localStorage`-only with no server session, no
`middleware.ts`, and the logged-in name never carries into the
clerk/approver name fields on the workflow screens. Wrote
`docs/01-system-design.md` §10-§13 and updated §6/§8 before any app code,
per the repo's design-before-build rule.

Why: `AGENTS.md`'s non-negotiable constraint (no supplier/inventory/
accounting write ever actually executes) and the brief's "simulated inputs
must be labeled" rule both stay intact under this scope — every new
feature is either a real write to the app's own DB (auth session,
inventory ledger, add-stock) or a real computed read (KPIs, alarms), never
a new external action. Full phased plan in
`dev-docs/phase-09-design-v2-auth-inventory-kpis.md`.
