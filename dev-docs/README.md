# dev-docs

One file per unit of coding work (a "dev phase"), written by whichever agent
did the work, so a human reviewer who wasn't in the chat can see exactly
what changed, why, and how it was checked — without reading scrollback.

**Not the same thing as `TASKS.md`'s Phase 1-4** (design / build / evidence /
presentation — the exercise's own high-level phases). A dev-docs phase is a
smaller unit: roughly one coherent piece of work (e.g. "ported the design
system to Next.js", "added Postgres persistence"). Several dev-docs phases
can happen inside one `TASKS.md` phase.

## The rule

**No dev-docs phase starts until the previous one has been reviewed and
validated by Zakaria.** See root `AGENTS.md` § "Dev-docs and phase-gate
workflow" for the full process any agent must follow. In short: write the
phase doc, stop, wait for an explicit yes before starting the next one.

## Index

| # | File | What it covers | Status |
|---|------|-----------------|--------|
| 1 | [phase-01-ui-design-system-port.md](phase-01-ui-design-system-port.md) | Ported the Tibnexis-style design system (tokens, sidebar/table/button/card CSS) into the Next.js app | Awaiting review |
| 2 | [phase-02-login-intro-dashboard-shell.md](phase-02-login-intro-dashboard-shell.md) | Cosmetic login screen, 3D loading intro, dark sidebar/topbar shell, home dashboard stat tiles | Awaiting review |
| 3 | [phase-03-langgraph-gemini-narrative-service.md](phase-03-langgraph-gemini-narrative-service.md) | Python/LangGraph/Gemini narrative microservice — built, then paused | Awaiting review |
| 4 | [phase-04-postgres-persistence.md](phase-04-postgres-persistence.md) | Replaced in-memory state with Postgres (docker-compose + schema + store.ts rewrite) | Awaiting review |
| 5 | [phase-05-branding-icons-landing-page.md](phase-05-branding-icons-landing-page.md) | Named the app "Dockline", real local icons + favicon/logo, landing/about page, transitions | Awaiting review |
| 6 | [phase-06-pending-clobber-guard.md](phase-06-pending-clobber-guard.md) | Fixed silent pending-scan/invoice clobbering, black favicon, dev-mode indicator badge | Awaiting review |
| 7 | [phase-07-brand-assets.md](phase-07-brand-assets.md) | Generated Dockline logo/hero/login art and evidence schemas wired in, transparent-icon fix, Makefile | Awaiting review |
| 8 | [phase-08-immersive-transitions.md](phase-08-immersive-transitions.md) | Splash entry animation, login/logout transition overlays, route progress bar | Awaiting review |
| 9 | [phase-09-design-v2-auth-inventory-kpis.md](phase-09-design-v2-auth-inventory-kpis.md) | Design doc update only: real auth/session, inventory ledger, alarms, KPIs (§10-§13); no app code yet | Validated 2026-09-17 |
| 10 | [phase-10-real-auth-session.md](phase-10-real-auth-session.md) | Real signed-cookie session over seeded clerk/approver users, replacing v1's localStorage-only login; role-gated confirm-receipt/approve-notice | Validated 2026-09-17 |
| 11 | [phase-11-inventory-ledger.md](phase-11-inventory-ledger.md) | Inventory ledger read-model (SUM(receipts.accepted) by part) + clerk-only "add new stock" write | Validated 2026-09-17 |
| 12 | [phase-12-trast-client-fit.md](phase-12-trast-client-fit.md) | Client-fit rebrand for hackathon-assigned client trast: indigo palette and terminology, then trast's real logo/name on login+app shell, recolored art, simplified login credentials, simulation copy consolidated to About page | Validated 2026-09-17 |
| 13 | [phase-13-v3-lifecycle-rebuild.md](phase-13-v3-lifecycle-rebuild.md) | Part/inventory-master entity + QR generation, PO lifecycle (computed status) + timeline page, sender-scan step reusing existing classify logic, required damage evidence on receipts, §10 role gating shelved for single-account demo | Awaiting review |

Phases 1-4 are written retroactively (the workflow below didn't exist yet
when they were built) — flagged here so review can catch up before any new
phase starts. Phase 5 is the first one written under the actual workflow,
but was done as part of an active back-and-forth with Zakaria rather than
waiting for a validation message after each sub-step within it.
