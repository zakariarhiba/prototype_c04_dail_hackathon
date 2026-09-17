# Phase 6 — Guard against silent pending-scan/invoice clobbering, icon/dev-indicator cleanup

**Status: awaiting review**

## What was asked

Requested review of the prototype against `docs/01-system-design.md` and
`AGENTS.md`'s non-negotiable constraints. Found and fixed a real bug during
that review (not a pre-planned build item), plus two small cosmetic issues
Zakaria flagged while looking at the running app. Grouped as one phase
since all three came out of the same review session and are each too small
to warrant their own phase number.

## What changed

- `app/app/lib/store.ts` — `simulateIncomingScan()` and
  `simulateIncomingInvoice()` now throw if a pending scan/invoice already
  exists in memory, instead of silently overwriting it.
- `app/app/api/simulate-scan/route.ts`,
  `app/app/api/simulate-invoice/route.ts` — added try/catch, now return
  `{ ok: false, error }` with HTTP 409 on that guard, matching the
  `{ ok, error }` shape already used by `confirm-receipt` and
  `approve-notice`. Previously these two routes did no error handling at
  all and returned the pending object directly.
- `app/app/(app)/receiving/page.tsx`,
  `app/app/(app)/invoices/page.tsx` — `simulateScan()` /
  `simulateInvoice()` now read the JSON response and call `setError()` on
  `ok: false`, instead of ignoring the fetch response entirely.
- `app/app/icon.png` (new) — 64x64 PNG rasterized from the existing
  `icon.svg` via `sharp`, alpha channel preserved.
- `app/next.config.ts` — added `devIndicators: false`.

## Why

Reviewing `store.ts` against the design doc, then exercising the API
directly with `curl` (bypassing the UI's disabled-button guard), showed
that calling `POST /api/simulate-scan` twice before confirming the first
scan silently discarded the first pending scan with no error, no audit
trail — the UI only prevented this client-side (`disabled={busy ||
!!pending}`), the server had no equivalent check. Same shape of bug existed
for `simulateIncomingInvoice()` vs. `pendingInvoice`.

This isn't a "write without confirm" violation — nothing was persisted
incorrectly — but it's silent data loss of an in-flight human decision,
which conflicts with the design's intent that every scan/invoice event
reach a human decision (confirm, discard-as-duplicate, or dismiss), not
disappear un-actioned. A direct API call, a double-click race, or a second
browser tab could all trigger it.

Separately, Zakaria reported the browser tab icon looking "overly black."
Cause: only `icon.svg` existed, and Next.js auto-converts an SVG icon to a
legacy `favicon.ico` for browsers without SVG-favicon support; that
conversion flattened the SVG's transparent corners (outside the
rounded-rect shape) to black. Adding an explicit `icon.png` with alpha
preserved gives Next.js a raster source to serve directly instead of
generating the lossy `.ico`.

Also asked about the black circular "N" badge with a Route/Bundler/
Preferences popup shown over the app in dev mode — that's Next.js's
built-in dev-mode indicator, not a bug, and never appears in a production
build. Turned off via `devIndicators: false` since it's noisy over a demo
UI.

## How it was verified

- Reproduced first: `docker compose up -d`, `npm run dev`, `POST
  /api/reset`, then two back-to-back `POST /api/simulate-scan` calls before
  confirming — confirmed via `GET /api/state` that the first pending scan
  (`SCAN-2`, classified `DUPLICATE`) was silently replaced by the second
  (`SCAN-3`, `AMBIGUOUS`), no error surfaced anywhere.
- Applied the fix, then re-ran the same repro: second `simulate-scan` call
  now returns `{"ok":false,"error":"A scan is already pending clerk
  confirmation..."}` with HTTP 409, first pending scan preserved. Same
  repro/fix/re-verify done for `simulate-invoice`.
- Full scan → confirm → invoice → approve flow re-run end to end via
  `curl` against the live Postgres container after the fix, to confirm no
  regression: `NEW` scan on `PO-2` confirmed, invoice reconciled with
  correct evidence lines, notice approved and persisted (`simulated:
  true`), `GET /api/state` showed it after the round trip.
- `npx tsc --noEmit` clean before and after.
- State reset back to clean seed afterward.
- Icon fix: rebuilt `.next` clean, restarted dev server, confirmed via
  `curl` on `/` that the emitted `<head>` now has both
  `<link rel="icon" href="/icon.png" sizes="64x64" type="image/png">` and
  the existing `image/svg+xml` link, and that `GET /favicon.ico` now 404s
  (Next stopped generating it) instead of serving the flattened black
  version. Fetched `/icon.png` directly and confirmed it's a valid RGBA
  PNG.
- Dev-indicator fix: restarted dev server after the config change, app
  still serves `200` on `/`; `devIndicators: false` requires no other
  verification since it only affects an in-browser dev-mode overlay.

## Known gaps / open items

- The same "no pending" invariant is still enforced only per-call, not
  transactionally — two truly concurrent requests could theoretically both
  pass the check before either sets `mem.pendingScan`. Given this is a
  single-user prototype with no concurrency handling (`docs/01-system-design.md`
  §8 non-goal), not fixed further here.
- `dismiss-invoice` has no equivalent guard need (it clears state, doesn't
  create it) — not touched.
