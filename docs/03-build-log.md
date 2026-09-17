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

### Event 2 — hackathon brief confirmed client as trast; branding escalated

What happened / what changed: after phases 10-11 (auth, inventory ledger)
were built, the hackathon organisers sent a mid-build update confirming
the assigned exercise client as trast (`https://trast.de/`), reframing the
exercise user as "the parts receiving lead," and adding client fit
(look/feel, wording, workflow) as an explicit review criterion. Same day,
Zakaria asked to go further than an initial color-only reskin: use trast's
actual logo/name on the login screen and app shell, simplify the demo
login credentials to a professional username/password format, and move
the dev-facing "why this is simulated" explanations off the working
screens onto the About page.

What we did in response: fetched and reviewed trast.de directly (not
guessed) for its real palette/tone before touching any code; recolored the
theme and the existing raster brand art in place (Pillow hue-shift, not a
full re-generation) rather than rebuilding illustrations from scratch;
downloaded trast's actual logo/mark from their site and swapped it in on
every surface that showed the old generated "Dockline" mark (login,
topbar/sidebar, landing header, splash, transition overlay); added a
separate `username` column to `users` so login uses a short identifier
(`priya_lead`/`sam_lead`) while the friendly display name stays for the
UI; consolidated the per-page simulation explanations into the About page.
Kept "Dockline" as the internal project name in `docs/`/`dev-docs`/DB
comments — only user-visible brand surfaces changed.

Why: `docs/01-system-design.md` §14 records the fetched brand reference and
each decision inline (why reskin-then-real-logo, why username is separate
from display name, why the raster art was recolored instead of
regenerated). Full verification and file-by-file diff in
`dev-docs/phase-12-trast-client-fit.md`.
