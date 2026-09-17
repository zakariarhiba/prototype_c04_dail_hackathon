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

## 2026-09-17 — v3 rebuild scoped: inventory master, QR, PO lifecycle, damage evidence

What happened: phases 10-12 (real auth, inventory ledger, trast rebrand)
validated by Zakaria. Same day, Zakaria asked for a fuller end-to-end demo
scenario: a real Part/inventory-master entity with generated QR codes, a
PO lifecycle view (created through delivered, staying open until fully
resolved), an explicit sender-scan step ahead of the existing classify/
receive flow, and required photo/description evidence whenever a receipt
records damage — all walked in one continuous demo, single account for
now (role separation from §10 shelved, not removed).

Why: makes the QR/scan story concrete for presentation and gives each PO
a single place to see its whole history, instead of cross-referencing
Receiving/Invoices/Inventory. Single-account scope is a deliberate,
reversible demo simplification, not a redesign — role gating, audit,
security, more KPIs, and AI-assisted review are logged as explicit
next-phase work.

What changed: `docs/01-system-design.md` §15 written first (entities,
lifecycle states, real-vs-simulated split for this pass), `TASKS.md`
Phase 6 (16-20) added, before any code. See §15 for the full scope; phase
docs for 16-20 will record what was actually built and verified.

## 2026-09-17 — Phase 13 built: v3 lifecycle rebuild + click-through fixes

What we did: built `docs/01-system-design.md` §15 in full (Part/inventory-
master entity + QR generation, PO lifecycle as a computed read-model,
sender-scan step reusing §4's classifyScan unchanged, required damage
evidence on receipts, §10 role gating shelved for a single-account demo).
Verified end-to-end via curl (part creation, QR data URL, scan-to-confirm
with the damage-evidence gate, cross-role approval, PO status flipping to
`closed`). Full detail and exact commands in
`dev-docs/phase-13-v3-lifecycle-rebuild.md`.

Zakaria then clicked through the running app and found two issues, fixed
same phase: the About page (`/`) was session-blind and looked like it
signed the user out (fixed: made it use `useSession()`); the landing/login
background didn't read as trast's brand (fixed: soft indigo gradient wash
behind the landing hero, matching §14's description of the real site
rather than the login screen's separate dark visual panel). Two further
cosmetic requests followed: bigger logo mark (22-26px → 30-34px) and the
visible wordmark changed to "Trast Dockline" across login/landing/topbar/
sidebar — text and sizing only, internal "Dockline" naming in docs/DB
untouched. All logged in §14's follow-up note and the phase-13 doc's
follow-up section.

Why: keeps the design doc and the phase doc as the record of what changed
and why, instead of only chat history, per the root AGENTS.md rule.
