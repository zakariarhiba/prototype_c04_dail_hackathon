# Phase 2 — Login screen, 3D intro, dashboard shell, home stat tiles

**Status: awaiting review** (written retroactively — see `dev-docs/README.md`)

## What was asked

Match the reference Tibnexis screenshots more closely: a split-screen login
page, a 3D logo loading animation, a dark sidebar + topbar-with-icons
dashboard shell, and colored-left-border stat tiles on the home page. All
explicitly agreed to be **cosmetic only** — this prototype has no real
authentication (see `docs/01-system-design.md` §1/§8), so the login and
intro do not check or gate anything real.

## What changed

- **Route restructure**: `app/app/page.tsx`, `app/app/receiving/`,
  `app/app/invoices/` moved under `app/app/(app)/` (a Next.js route group —
  URLs unchanged) so a new `app/app/login/page.tsx` route can render without
  the dashboard chrome.
- `app/app/login/page.tsx` (new) — split screen: gradient visual panel left,
  a card right with a name field and a password field. Submitting stores
  the name in `localStorage` (`c04_user_name`) as the clerk/approver
  identity and redirects to `/`. The password is never checked against
  anything.
- `app/app/components/LoadingIntro.tsx` (new) — a CSS 3D-transform rotating
  cube overlay, shown once per browser session (`sessionStorage` flag),
  fades out after ~1.7s.
- `app/app/components/ThemeToggle.tsx` (new) — light/dark toggle, persisted
  in `localStorage`, sets `document.documentElement.dataset.theme`.
- `app/app/(app)/layout.tsx` (new) — the dashboard chrome: renders
  `LoadingIntro`, the dark sidebar, the mobile topbar, and a userbar (theme
  toggle, inert notification-bell and chat icon buttons, avatar+name,
  "Déconnexion" which clears `c04_user_name` and returns to `/login`).
  Also the auth guard: redirects to `/login` if `c04_user_name` isn't set.
- `app/app/layout.tsx` — reduced to the bare html/body/globals shell (no
  chrome), so `/login` renders without the sidebar.
- `app/app/globals.css` — added: `:root[data-theme="light"]` /
  `:root[data-theme="dark"]` explicit overrides (so the toggle can force a
  theme regardless of OS preference); the sidebar was changed to use its
  own fixed-dark palette (`--sidebar-bg` etc.) independent of the
  light/dark toggle, matching the reference screenshots where the sidebar
  never lightens; `.app-userbar`/`.app-userbar__icon`/`.lien-secondaire`;
  `.stat-tile`/`.stat-tile-row` (colored left border); `.login-screen`/
  `.login-card`; `.intro-overlay`/`.intro-cube` (the 3D animation).
- `app/app/(app)/page.tsx` — now a client component: shows
  "Bienvenue, {name}", fetches `/api/state` to populate stat tiles
  (delivery notes logged, pending scan/invoice, notices, discarded
  duplicates), keeps the two workflow entry cards.

## Why this shape

- Login/intro are additive UI only — no new backend concept, no change to
  the classification/reconciliation logic or the confirm/approve gates.
- The route-group restructure was the simplest way in Next.js's App Router
  to give `/login` a different layout tree without duplicating the shell
  markup.
- Sidebar-always-dark was a deliberate match to the reference screenshots
  (screenshot 3 showed a light main area with a still-dark sidebar) rather
  than an oversight.

## How it was verified

- `npx tsc --noEmit` clean after the restructure (had to clear a stale
  `.next` cache once — Next.js's generated route types didn't know about
  the moved files until regenerated).
- `curl` against `/`, `/login`, `/receiving`, `/invoices` — 200, no error
  markers, `/login` response contains the `login-screen` class.
- Not verified: a real click-through in an actual browser (login → intro →
  dashboard → logout round trip was reasoned about from the code, not
  clicked through visually).

## Known gaps / open items

- No screenshot/visual review yet — same gap as phase 1, now compounded
  (this is the reason the current phase-gate workflow was requested).
- The notification bell and chat icons in the userbar are visibly inert
  (no click handler beyond a title tooltip) — intentional (no backing
  feature), but worth confirming that's still the desired scope.
