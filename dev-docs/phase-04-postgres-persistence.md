# Phase 4 — Postgres persistence (Supabase-compatible schema)

**Status: awaiting review** (written retroactively — see `dev-docs/README.md`)

## What was asked

Of the mandated tool stack (see phase 3), use Supabase for real persistence
now — or plain Postgres now with an easy path to Supabase later, since
Supabase is itself Postgres.

## What changed

- `docker-compose.yml` (new, repo root) — single `postgres:16-alpine`
  service, user/db `c04`, mapped to host port **5433** (not 5432 —
  deliberately avoids colliding with a Postgres already running locally on
  this machine for other projects), a named volume for the data, a
  healthcheck.
- `db/schema.sql` (new) — five tables: `orders`, `delivery_notes`,
  `receipts`, `discarded_duplicates`, `discrepancy_notices` (evidence stored
  as `jsonb`), plus a `counters` table used for atomic ID generation
  (`DN-3`, `RC-7`, ...). No Supabase-specific features (no RLS, no
  `auth.*`) — on purpose, so this file runs unchanged against a real
  Supabase project later.
- `app/app/lib/db.ts` (new) — a `pg.Pool` (stashed on `globalThis` to
  survive Next.js dev hot-reload, same pattern the old in-memory store
  used), `ensureSchema()` (runs `schema.sql`, memoized), `nextId(prefix)`
  (atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`).
- `app/app/lib/store.ts` — rewritten. Every exported function is now
  `async`. Confirmed state (orders, delivery notes, receipts, discarded
  duplicates, discrepancy notices) is read from and written to Postgres.
  A **pending** scan or invoice (the system's proposal, before a human
  confirms/approves) deliberately stays in an in-memory
  `globalThis`-backed object, not the database — per
  `docs/01-system-design.md` §3 ("nothing is written before confirmation"),
  a pending proposal isn't state yet.
- `app/app/api/*/route.ts` (state, reset, confirm-receipt, approve-notice,
  simulate-scan, simulate-invoice) — added `await` to match the now-async
  store functions. `dismiss-invoice` unchanged (purely in-memory, no DB
  involved).
- `app/app/lib/types.ts` — removed the unused `Invoice` type (the seed's
  known-invoices list was never read anywhere once the DB rewrite dropped
  it from `AppState`).
- `app/.env.local.example` (new) — `DATABASE_URL` pointing at the compose
  Postgres.
- `docs/01-system-design.md` §6/§8/§9, `TASKS.md`, root `README.md` —
  updated to describe real persistence instead of "no persistence" as a
  non-goal, and to give the new run instructions
  (`docker compose up -d` before `npm run dev`).

## Why this shape

- Plain Postgres, not the Supabase SDK/CLI, because the ask was "easy to
  switch to Supabase later" — Supabase's Postgres is wire-compatible, so a
  schema with zero Supabase-specific features ports by changing
  `DATABASE_URL` and re-running `schema.sql`, nothing else.
- Kept pending scan/invoice out of the database rather than persisting
  everything, specifically to keep the "no write before human confirmation"
  rule literally true at the storage layer too, not just as an application
  convention.

## How it was verified

- Docker wasn't running (`colima` was stopped) — started it, then
  `docker compose up -d`, then polled `pg_isready` until the container
  reported ready.
- `.env.local` written, dev server restarted against it.
- `POST /api/reset` → `GET /api/state` — confirmed seed data
  (`PO-1`/`PO-2`, `DN-1`/`DN-2`, `RC-1`/`RC-2`) loaded correctly from
  Postgres.
- First real bug found and fixed here: `POST /api/simulate-scan` then
  `POST /api/confirm-receipt` failed with
  `duplicate key value violates unique constraint "delivery_notes_pkey"` —
  the per-prefix counter for `DN` started at 1 and collided with the seed's
  own fixed `DN-1`/`DN-2` IDs. Fixed by seeding the `DN`/`RC` counters past
  the seed's own count during `resetState()`. Re-tested: `DN-3`/`RC-3`
  generated correctly afterward.
- Restart test: killed the dev server mid-session (after having written
  `DN-3`/`RC-3`), restarted it, `GET /api/state` still showed `DN-3`/`RC-3`
  — confirms this is real cross-restart persistence, not memory.
- Full workflow smoke test after the fix: scan (NEW) → scan (DUPLICATE) →
  confirm duplicate (discarded, logged) → simulate invoice (mismatch found,
  correct evidence lines) → approve notice → `GET /api/state` showed the
  discarded-duplicate row and the notice, with `evidence` correctly
  round-tripped through `jsonb`.
- `npx tsc --noEmit` clean throughout.
- State reset back to the clean seed afterward, so the running app is left
  in a demo-ready state.

## Known gaps / open items

- No migrations tooling — schema changes mean editing `schema.sql` and
  resetting, not an incremental migration. Acceptable for a prototype,
  called out explicitly in `docs/01-system-design.md` §8 non-goals.
- Not actually pointed at a Supabase project yet — the "easy switch" claim
  is based on the schema being vanilla Postgres, not yet proven by actually
  doing the switch.
- No automated tests were added; verification above was manual `curl`
  exercises of the API, not a test suite.
