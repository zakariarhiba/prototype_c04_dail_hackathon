# Phase 8 — Splash entry animation, login/logout transitions, route progress bar

**Status: awaiting review**

## What was asked

Zakaria asked for a more "immersive" feel: a 3D-style loading animation on
first opening the app (landing, login, or a direct link into the app,
whichever is hit first), a similar moment after logging in and after
logging out, and a small loading cue between ordinary in-app page
transitions. He then supplied a detailed reference timeline (icon
"draws" in, fades, a glow flash, the full wordmark assembles with a slight
overshoot, then the logo flies from center-screen to its real position in
the header) and asked for something in that spirit, not a literal copy
(different color theme, no requirement to match every millisecond).

## What changed

- `app/app/components/TransitionOverlay.tsx` (new) — generalized the
  existing phase-2 3D spinning cube into a reusable overlay that counts a
  live percentage up to 100% over a caller-supplied duration and calls
  `onDone` once. Used for the post-login and post-logout moments.
- `app/app/components/Splash.tsx` (new) — the richer entry-only animation:
  icon clip-path "draw" wipe (0.85s) → icon fade + radial glow flash
  (~0.9-1.6s) → full wordmark assembles in with an overshoot bounce
  (0.95-1.5s) → if a real header logo exists on the current page, measures
  its position/size and flies the wordmark there via a computed
  `translate()+scale()` transition (FLIP-style), then unmounts; if no such
  logo exists on the page (e.g. landing directly on `/login`), just holds
  briefly and fades the whole thing out instead. Skips straight to done
  under `prefers-reduced-motion: reduce`. A 1.5s safety-net timeout forces
  completion if the fly transition's `transitionend` never fires.
- `app/app/components/LoadingIntro.tsx` — rewritten to render `Splash`
  (was: the old cube directly) and moved from being mounted only inside
  `(app)/layout.tsx` to the root `app/app/layout.tsx`, so the first-visit
  animation plays regardless of which page is opened first, not just
  `/dashboard`. Still gated by the same `sessionStorage` flag, so it still
  plays once per browser tab session.
- `app/app/components/RouteProgressBar.tsx` (new) — a slim top-of-viewport
  bar that flashes (~0.5s) on every route change, mounted globally in root
  layout. Skips the very first render so it doesn't double up with the
  splash.
- `app/app/layout.tsx` — mounts `LoadingIntro` and `RouteProgressBar`.
- `app/app/(app)/layout.tsx` — removed the old direct `LoadingIntro`
  mount (root now covers it); added a `loggingOut` state and
  `TransitionOverlay` ("Signing out…") shown on logout-button click, with
  the actual `localStorage` clear + redirect deferred to the overlay's
  `onDone`; logout button disabled while the overlay plays; added
  `data-dockline-logo-target` to the topbar brand link as the splash's fly
  destination when the app shell is the first thing rendered.
- `app/app/login/page.tsx` — added a `signingIn` state and
  `TransitionOverlay` ("Signing in as {name}…") shown on submit, with the
  `router.push("/dashboard")` deferred to `onDone`; form fields and the
  submit button disabled while it plays.
- `app/app/page.tsx` — added `data-dockline-logo-target` to the landing
  header brand span as the splash's fly destination when landing is the
  first page opened.
- `app/app/globals.css` — new `.splash*` rules (icon draw/fade keyframes,
  glow-flash keyframes, wordmark assemble/fly keyframes and transition),
  new `.route-progress` bar + keyframe, `.page-transition`'s existing
  fade-in changed to a subtle 3D tilt (`perspective`/`rotateX`) instead of
  a flat vertical fade, `.intro-scene__pct` style for the cube's
  percentage label.
- Two `react-hooks/set-state-in-effect` ESLint findings introduced by this
  work (`LoadingIntro.tsx`, `TransitionOverlay.tsx`) suppressed with
  justified inline comments, matching the existing convention used
  elsewhere in the codebase (e.g. `receiving/page.tsx`'s initial-load
  effect) — both are legitimate syncs with an external system
  (`sessionStorage`, a prop going false), not something to refactor away.

## Why

The existing phase-2 intro was a flat spinning cube gated only inside the
`(app)` route group, so it silently never played if someone entered
through the public landing or login pages first — the actual common
entry path. Splitting the "big brand moment" (Splash, entry only) from the
"small wait cue" (TransitionOverlay, login/logout) keeps each animation
matched to what it's communicating: the splash is a one-time flourish that
lands on the real logo wherever it happens to be on screen; login/logout
are just brief, frequent waits that don't need a special destination
animation each time.

## How it was verified

- `npx tsc --noEmit` clean after each round of changes.
- `npx eslint` clean on every new/changed file (`Splash.tsx`,
  `TransitionOverlay.tsx`, `LoadingIntro.tsx`, `RouteProgressBar.tsx`,
  `page.tsx`, `(app)/layout.tsx`, `login/page.tsx`); the one remaining
  `react-hooks/set-state-in-effect` error in `(app)/layout.tsx` is
  pre-existing (the auth-check effect, untouched by this work), not
  introduced here.
- Used `mcp__claude-in-chrome` (Zakaria's own browser, with his awareness)
  to drive the actual flows: confirmed the splash's cube/wordmark stages
  render in sequence (verified with a temporarily lengthened duration to
  make the fast real timing catchable in a screenshot, then reverted),
  confirmed login submits through the "Signing in as…" overlay into
  `/dashboard`, confirmed the generated `dockline-mark.png` renders
  correctly on the splash's icon faces after the phase-7 transparency fix.
- Caught and corrected a false "the animation doesn't show up" report
  during review: it was `sessionStorage` correctly not replaying in
  browser tabs the review automation had already visited (working as
  designed — once per tab session), not a code bug. Confirmed by
  re-reading `LoadingIntro.tsx` and explaining the mechanism rather than
  changing behavior.
- Manual review of `Splash.tsx`'s fly-to-target math (delta of rect
  centers, width-ratio scale) against the two tagged targets
  (`app/app/page.tsx` landing header, `(app)/layout.tsx` topbar brand).

## Known gaps / open items

- The fly-to-target step assumes the target element is present and
  stable in the DOM at the moment the wordmark finishes assembling
  (~1.5s in). If a page's layout shifts significantly in that window
  (e.g. slow font/image load reflowing the header), the computed
  delta could be stale; the 1.5s safety-net timeout bounds the worst
  case (splash disappears anyway) but the landing position could look
  slightly off in that edge case. Not something this prototype's fixed,
  static layouts are expected to hit.
- No target is tagged inside `login/page.tsx` itself (its `Logo` sits
  alone in the card, no adjacent wordmark text), so opening the app
  directly on `/login` always uses the "auto fade" splash variant rather
  than flying to the login card's logo. Acceptable given the spec's own
  `--auto` fallback for exactly this "no real target" case.
- `TransitionOverlay`'s percentage counter is a fixed-duration linear
  approximation (not tied to any real async work finishing) — same as the
  phase-2 cube it replaced, just made explicit with a number now.
