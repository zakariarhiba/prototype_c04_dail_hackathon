# Phase 10 — Real auth/session

## What was asked

`docs/01-system-design.md` §10, validated by Zakaria 2026-09-17 (phase-09
sign-off, see `dev-docs/phase-09-design-v2-auth-inventory-kpis.md`): replace
v1's `localStorage.setItem("c04_user_name", ...)` cosmetic login — no server
session, no cookie, no route protection, and a name that never actually
carried into the `clerk_name`/`approved_by` fields, which were separate
free-text inputs defaulting to "Clerk on duty" / "Accounting clerk on duty"
— with a real signed-cookie session over two seeded demo users (`clerk`,
`approver`), with `confirm-receipt` gated to `role=clerk` and
`approve-notice` gated to `role=approver`.

## What changed

**Schema** (`db/schema.sql`): new `users` table (`id`, `name` unique,
`role` check-constrained to `clerk`/`approver`, `password_hash`).

**`app/app/lib/auth.ts`** (new, pure — no `next/headers` import so it can
also run in the edge-runtime proxy): signed-cookie helpers (`signSession`/
`verifySession`, HMAC-SHA256 over a JSON payload via Web Crypto, not
`node:crypto`, so the same code runs in both the Node route handlers and the
edge proxy) and password hashing (PBKDF2-SHA256 via `crypto.subtle`, salted,
100k iterations — demo-grade, matches the design's "not real identity
verification" scope).

**`app/app/lib/session.ts`** (new): the `next/headers`-dependent half —
`getSession()`/`setSessionCookie()`/`clearSessionCookie()`. Split out from
`auth.ts` because `next/headers` cannot be imported into the edge-runtime
proxy; `proxy.ts` only ever imports the pure `auth.ts` functions.

**`app/app/lib/store.ts`**: seeds two demo users in `resetState()`
(`Priya (clerk)` / `clerk-demo`, `Sam (approver)` / `approver-demo`,
password hashed via `auth.ts`), and a new `verifyLogin(name, password)`
that checks the `users` table.

**New API routes**: `POST /api/login` (credential check, sets the signed
cookie), `POST /api/logout` (clears it), `GET /api/session` (returns the
current session's `{name, role}` or `null`).

**Gated existing API routes** (all read `getSession()` from
`app/lib/session.ts`):
- `POST /api/confirm-receipt` — 401 if no session, 403 if `role !== clerk`.
  `clerk_name` is now derived server-side from the session, not trusted from
  the request body (closes the "typed name never linked to login" bug).
- `POST /api/approve-notice` — same, `role !== approver`, `approved_by`
  likewise server-derived.
- `GET /api/state`, `POST /api/simulate-scan`, `POST /api/simulate-invoice`,
  `POST /api/dismiss-invoice` — 401 if no session (open to either role, per
  §10's "dashboard/read endpoints are open to either authenticated role").
- `POST /api/reset` — deliberately left **un**gated. It's the seed-state
  bootstrap utility, including how the `users` table itself gets (re)seeded
  on a fresh database; gating it created a lockout (fresh DB → empty `users`
  table → no possible login → no way to ever call `/api/reset` to seed it).
  Caught by verification, see below.

**`app/proxy.ts`** (new — Next 16 renamed `middleware.js` to `proxy.js`;
confirmed via `node_modules/next/dist/docs`): redirects `/dashboard`,
`/receiving`, `/invoices` to `/login` when the session cookie is missing or
invalid. UX convenience only — the API routes above are the actual
enforcement boundary, checked independently.

**Client pages**:
- `app/app/login/page.tsx`: real form, `POST /api/login`, demo credentials
  shown in the note (matches README).
- `app/app/(app)/layout.tsx`: session via `useSession()` (new hook,
  `app/app/lib/useSession.ts`) instead of `localStorage`; logout calls
  `POST /api/logout`.
- `app/app/(app)/dashboard/page.tsx`: greets from session; the stale
  "Simulated: login" line in the real-vs-simulated list corrected to
  "Real (v2): login and session".
- `app/app/(app)/receiving/page.tsx`, `.../invoices/page.tsx`: removed the
  unlinked free-text "Clerk name"/"Approver" inputs; identity now comes from
  the session, and the confirm/approve button is disabled with an inline
  message when the signed-in role doesn't match what the action needs.

**`README.md`**: "Real vs. simulated" and "Limitations" updated — login is
now real, credentials documented, the old "no authentication" line replaced
with the actual scope (real session enforcement, still no signup/recovery/
rate-limiting/OAuth).

**`.env.local.example`**: documented `SESSION_SECRET` (optional — a dev
default is baked into `auth.ts` so the app still runs without it set).

## How it was verified

- `npx tsc --noEmit` — clean. (Caught and fixed a Web Crypto typing issue:
  `base64urlDecode` needs to return `Uint8Array<ArrayBuffer>`, not the
  default `Uint8Array<ArrayBufferLike>`, for `crypto.subtle.verify`/
  `importKey` to typecheck under this TS/lib.dom version.)
- `npx eslint .` — one pre-existing unrelated error in
  `app/components/ThemeToggle.tsx` (not touched this phase); nothing new
  from this change.
- Ran the dev server against the real docker-compose Postgres and drove the
  actual HTTP surface with `curl`, cookie jars per role:
  - `POST /api/reset` → `{"ok":true}`.
  - `POST /api/login` with `Priya (clerk)` / `clerk-demo` and with
    `Sam (approver)` / `approver-demo` → both succeed, correct role
    returned; wrong password → `401 {"error":"Invalid name or password."}`.
  - `GET /api/session` with the clerk cookie → returns that identity.
  - `GET /api/state` with no cookie → `401`.
  - `POST /api/simulate-scan` as clerk → succeeds.
  - `POST /api/confirm-receipt` as the **approver** cookie → `403 "Only a
    clerk can confirm a receipt."`; as the clerk cookie → succeeds, writes
    `DN-3`/`RC-3`.
  - `POST /api/simulate-invoice` as clerk → succeeds.
  - `POST /api/approve-notice` as the **clerk** cookie → `403 "Only an
    approver can approve a discrepancy notice."`; as the approver cookie →
    succeeds, `approved_by` in the stored notice correctly reads
    `"Sam (approver)"` (server-derived from session, not client input).
  - `POST /api/logout` then `GET /api/session` → `user: null`.
  - `GET /dashboard` with no cookie → `307` redirect to `/login` (proxy).
  - `GET /dashboard` with a valid cookie → `200`.
  - Re-ran `POST /api/reset` at the end to leave a clean demo state.
- **Bug found and fixed during verification**: first pass gated
  `POST /api/reset` behind `getSession()`, which locks a fresh database out
  permanently (no seeded users → no possible login → no way to call reset
  to seed them). Removed the gate; documented why in the route file's
  comment and above.
- **Unrelated bug found and fixed during verification**: a stale `next dev`
  process from an earlier session (PID still holding port 3000) had already
  memoized its schema-init promise (`ensureSchema()`'s
  `globalThis.__c04SchemaReady`) before the `users` table existed in
  `db/schema.sql`, so it kept erroring `relation "users" does not exist`
  even after the file was saved — not a bug in this phase's code, just a
  stale process; killed it and started clean. Documented here so a future
  "why is this erroring" doesn't get mis-attributed to the migration logic.

## Known gaps / open items

- No password policy, account recovery, rate limiting on login attempts, or
  audit-grade session logging — explicitly out of scope per §10/§8.
- Only two hardcoded demo users; no self-service account creation.
- Session cookie has a fixed 8-hour lifetime, no refresh/rotation.
- `proxy.ts`'s redirect check only verifies the cookie signature, not
  whether the underlying user still exists (e.g. after a `resetState()`
  call re-seeds `users` with new UUIDs — here they're fixed IDs so this
  doesn't currently bite, but a signed cookie for a since-deleted user would
  still pass `verifySession` and only fail once an API route's `getSession()`
  is checked against real data it doesn't re-check either, since the role
  check just trusts the cookie payload — acceptable for this prototype's
  threat model, flagged for the real handoff in
  `docs/05-wolf-handoff.md`).
