# Phase 7 — Generated brand assets (logo, hero, login art, evidence schemas), Makefile

**Status: awaiting review**

## What was asked

Zakaria asked for image-generation prompts for: a Dockline logo (icon +
wordmark), a landing-page hero image, a login-page image, and illustrated
schemas of the classification/reconciliation scenarios, so he could
generate them with another model. He then supplied the generated images
and asked to wire them into the app. Separately, asked for a `Makefile`
covering the run/build/test commands already documented in the root
`README.md`.

## What changed

- `Makefile` (new, repo root) — `run`, `dev`, `db-up`/`db-down`/`db-logs`,
  `install`, `build`, `start`, `lint`, `typecheck`, `reset`, `clean`,
  `help`. Wraps the commands already in `README.md`'s run instructions;
  doesn't introduce new behavior.
- `app/public/dockline-mark.png` (new) — the generated Dockline icon mark
  (rounded-square badge, dock/checkmark motif). Background originally
  came back as an opaque checkerboard pattern baked into real pixels
  (`alpha: 255` everywhere, not actual transparency) rather than a real
  alpha channel — fixed by flood-filling the light/grayscale pixels
  connected to the image's edges down to `alpha: 0`, stopping naturally at
  the blue badge boundary since the interior white checkmark isn't
  connected to the outer background. Verified by sampling raw pixel alpha
  before/after at the corners and center.
- `app/app/icon.png` — regenerated (64x64) from the fixed, truly
  transparent `dockline-mark.png`, replacing the placeholder favicon from
  phase 6.
- `app/public/dockline-wordmark.png` (new) — generated light/dark logo
  lockup comparison image, saved as a brand reference asset. Not wired
  into the running app (it's a two-panel comp image, not something a page
  renders); left in `public/` for future use in docs/marketing.
- `app/public/landing-hero.png` (new) — generated hero illustration (dock
  scene with accepted/flagged crates). Wired into `app/app/page.tsx`'s
  hero section via `next/image`, with descriptive alt text.
- `app/public/login-illustration.png` (new) — generated login-panel
  illustration (clipboard/checkmark). Wired into
  `app/app/globals.css`'s `.login-screen__visual` as a CSS background
  image, layered under a dark gradient so the overlaid text stays legible.
- `docs/assets/scenario-classification.png`,
  `docs/assets/evidence-trail.png` (new) — generated illustrations of the
  three classification outcomes and the invoice evidence trail. Embedded
  in `docs/01-system-design.md` §4 and §5 respectively, next to the prose
  they illustrate.
- `app/app/page.tsx` — added the hero `<Image>` and its import.
- `app/app/globals.css` — `.landing-hero__image` styles;
  `.login-screen__visual` background updated to layer the new
  illustration under the existing gradient.
- `docs/01-system-design.md` — two `![...]()` image embeds added, no
  prose changes.

## Why

The v1 UI (from phases 1-5) had a plain checkmark-in-square icon and no
imagery beyond CSS gradients — functional but bare for a demo/presentation
context. Real brand assets and illustrative schemas make the landing page,
login screen, and system-design doc easier to read at a glance without
changing any of the underlying logic those pages describe.

The checkerboard-as-opaque-pixels issue is a known failure mode of some
image generators previewing transparency as a literal pattern instead of
encoding real alpha — worth flagging in case future generated assets (the
wordmark, hero, or login art) have the same problem if they're ever used
somewhere transparency matters; they haven't been needed as transparent so
far, so only the icon mark was fixed.

## How it was verified

- `npx tsc --noEmit` clean after wiring the hero image into `page.tsx`.
- `docker compose up -d`, `rm -rf .next`, fresh `npm run dev`; `curl`
  confirmed `/` and `/login` both return `200`, and
  `GET /landing-hero.png`, `GET /login-illustration.png` both return `200
  image/png`.
- Used `mcp__claude-in-chrome` (with Zakaria's awareness, on his own
  browser) to load `/` and `/login` and visually confirm both images
  render correctly in place.
- Icon transparency fix verified by reading raw RGBA pixel values via
  `sharp` before and after: corners went from `[255,255,255,255]` /
  `[214,214,214,255]` (opaque checkerboard) to `[255,255,255,0]` /
  `[214,214,214,0]` (fully transparent), while the badge center
  `[29,106,210,255]` and an interior checkmark sample stayed opaque and
  unchanged.
- `app/app/icon.png` regenerated from the fixed mark and re-verified as a
  valid 64x64 RGBA PNG via `file`.
- `make help`, `make typecheck` run successfully from repo root after
  adding the `Makefile`.

## Known gaps / open items

- `dockline-wordmark.png` was not checked for the same checkerboard issue
  in detail beyond a corner sample (it's opaque by design — a two-panel
  light/dark comparison image — so this doesn't apply to it, but worth
  remembering if it's ever repurposed as an overlay asset).
- The in-app header/sidebar `Logo` component (used in the topbar, sidebar,
  and login card) is intentionally left as the existing code-drawn SVG,
  not switched to the raster mark — it stays crisp at arbitrary sizes and
  adapts to theme via CSS variables, which a raster PNG can't do as
  cleanly. The raster mark is used for the favicon and the splash overlay
  (phase 8) instead.
