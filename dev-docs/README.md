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

Phases 1-4 are written retroactively (the workflow below didn't exist yet
when they were built) — flagged here so review can catch up before any new
phase starts. Phase 5 is the first one written under the actual workflow,
but was done as part of an active back-and-forth with Zakaria rather than
waiting for a validation message after each sub-step within it.
