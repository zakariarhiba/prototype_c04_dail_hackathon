# Phase 5 — Branding (Dockline), real icons, favicon, landing/about page, transitions

**Status: awaiting review**

## What was asked

1. Give the case a real product name (picked: **Dockline**, via
   `AskUserQuestion` — Zakaria chose it over the alternatives offered).
2. No emojis anywhere in the UI — real (local, inline SVG) icons instead.
3. Everything local — no external icon fonts/CDNs.
4. A favicon and a logo mark for the app.
5. Some transitions.
6. A landing/about page explaining the project, positioned before login —
   Zakaria's own words: "I will do the presentation in the landing page ...
   so after login and then the home page" (parsed as: landing/about page →
   login → dashboard home).

## What changed

- **Naming**: user-facing brand is now "Dockline" everywhere in the UI
  (tab title, sidebar, topbar, login screen, loading intro, landing page).
  "Case C04" is kept as the internal/exercise reference in the tagline and
  throughout `docs/`/`dev-docs/` — not renamed there, since that's the
  event's own case ID.
- **Logo mark**: `app/app/components/Logo.tsx` — a small inline SVG (a
  rounded square in `var(--color-primary)` with a checkmark), themeable via
  the same CSS variables as the rest of the app. Used in the sidebar brand,
  the mobile topbar brand, the login card, and the 3D loading intro's cube
  faces.
- **Favicon**: `app/app/icon.svg` (new) — the same mark, colors hardcoded
  (`#1f6feb`/`#ffffff`) since a static favicon file can't read CSS
  variables. Next.js's App Router picks this up automatically via its
  `icon.svg` file convention. The old default Next.js `favicon.ico` was
  deleted so it doesn't compete with it.
- **Icon set**: `app/app/components/icons.tsx` (new) — one inline SVG
  component per icon needed (Sun/Moon for the theme toggle, Bell, Chat,
  Eye/EyeOff for the login password field, Home, Inbox, Receipt, LogOut,
  Info), 24x24 viewBox, `stroke="currentColor"` so every icon themes with
  light/dark automatically, same pattern the Tibnexis reference used.
  Replaced every emoji: `ThemeToggle.tsx`, the userbar (bell/chat/logout),
  the sidebar nav (home/inbox/receipt), and the login page's
  show/hide-password button.
- **Landing/about page**: `app/app/page.tsx` rewritten from the old
  dashboard into a public page (outside the `(app)` route group, no
  sidebar/login required to view it) — hero section explaining the C04
  problem and Dockline's answer to it, the two workflow cards, an "About
  this prototype" real-vs-simulated summary, and a "Log in" call to action.
  New CSS: `.landing-page`/`.landing-header`/`.landing-hero`/`.landing-grid`
  in `globals.css`.
- **Dashboard moved**: the old `/` dashboard content moved to
  `app/app/(app)/dashboard/page.tsx` (now at `/dashboard`), since `/` is
  the new public landing page. Sidebar "Home" link and the login page's
  post-submit redirect both point at `/dashboard` now. A footer link in the
  sidebar ("About Dockline") points back at `/`.
- **Transitions**:
  - `app/app/components/PageTransition.tsx` (new) — a client component
    keyed on `usePathname()`, wrapping `{children}` inside `(app)/layout.tsx`
    so every route change re-triggers a CSS fade+rise animation
    (`.page-transition` / `@keyframes page-fade-in` in `globals.css`). No
    animation library.
  - Hover/press transitions added to buttons (`.bouton`, bare `<button>`),
    cards (`.carte-lien`, `.stat-tile` — both now lift slightly on hover),
    sidebar nav links, the userbar icon buttons, and the logout button.
  - The existing intro fade (`.intro-overlay--fade`, from phase 2) and
    login-screen layout were left as they were.

## Why this shape

- Icons as hand-written inline SVG (not an icon font/library) to keep
  "everything local" literal — no new npm icon package, no CDN, nothing
  that needs a network request to render.
- Favicon duplicates the logo's SVG markup with hardcoded colors rather
  than trying to make the file theme-aware — a favicon has no access to the
  page's CSS, so this is the simplest correct approach, kept in sync by a
  comment pointing at the other file.
- Route-group restructure (again, see phase 2) was the cleanest way to give
  `/` a completely different, chrome-free layout without duplicating markup.

## How it was verified

- `npx tsc --noEmit` clean after all changes.
- `grep -rnP` for emoji Unicode ranges across `app/` — zero matches,
  confirming no emoji slipped back in anywhere.
- `curl` against `/`, `/login`, `/dashboard`, `/receiving`, `/invoices`,
  `/icon.svg` — all 200.
- Confirmed page `<title>` reads "Dockline — Case C04 Delivery
  Reconciliation Prototype" and the landing page HTML contains "Dockline",
  "Log in to try it", and the hero section.
- Confirmed `/icon.svg` actually serves the Dockline mark SVG (not a 404 or
  the old Next.js default).
- **Real browser click-through done** (via the Chrome automation tools,
  closing the recurring gap from phases 1/2/3/4): landing page → login →
  dashboard → receiving, plus the light/dark theme toggle, in an actual
  Chrome tab, not just `curl`.
- **Bug found and fixed during that pass**: Chrome's saved-password
  autofill populated the cosmetic login form with the real logged-in
  user's actual saved email and password (from the browser's own password
  manager, unrelated to this app) — because the name/password fields
  looked like a real login form to the browser's heuristics. Nothing was
  submitted with those values. Fixed by adding `autoComplete="off"` to the
  name field, `autoComplete="new-password"` to the password field, and
  renaming both fields (`c04-display-name`, `c04-cosmetic-password`) so
  they no longer match saved-credential heuristics. Re-tested after the
  fix: fields render empty, no autofill.
- After the fix: full click-through confirmed working — landing page
  renders correctly, login accepts a typed name and redirects to
  `/dashboard`, the dashboard shows the right stat tiles/cards/banner in
  both light and dark, the sidebar stays dark in both, and simulating a
  scan on `/receiving` correctly shows the NEW classification with the new
  design-system styling (green success banner, form fields, secondary
  button).
- State reset back to the clean seed after testing.

## Known gaps / open items

- Only `/dashboard`'s NEW-classification path was click-tested in the
  browser; the DUPLICATE/AMBIGUOUS scan paths and the full invoices flow
  were exercised earlier only via `curl` (see phase 4), not re-verified
  visually with the new styling.
- The favicon is only an SVG (`icon.svg`); no PNG/ICO fallback or
  apple-touch-icon was added — fine for modern browsers, untested on
  anything that needs a raster fallback.
- "About Dockline" in the sidebar footer links to `/`, which is public and
  un-chromed — clicking it from inside the dashboard takes you out of the
  app shell entirely (by design, since `/` has no sidebar), worth
  confirming that's the desired feel rather than an in-app modal/panel.
- The autofill bug is a good reminder that any further cosmetic-auth-style
  forms in this app need the same `autoComplete` treatment up front, not
  discovered after the fact.

## Update: landing page full-width layout bug (found after initial review)

Zakaria reported the landing/about page (`/`) "isn't fully responsive"
at full laptop width, and separately asked to drop the "1."/"2." numbering
from the sidebar nav links.

- **Sidebar numbers removed**: `app/app/(app)/layout.tsx` nav links now
  read "Receiving" / "Invoice reconciliation" instead of "1. Receiving" /
  "2. Invoice reconciliation".
- **Landing page bug, root cause found**: `globals.css`'s `body { display:
  flex; }` rule (added in phase 2 so the dashboard's sidebar and main
  column sit side by side) applies to every page sharing the root layout,
  including the plain landing/login pages. `.login-screen` already had an
  explicit `width: 100%`, which happened to compensate — but `.landing-page`
  didn't, so as a flex item with no declared width it shrank to fit its
  content instead of filling the viewport. Visually: at full laptop width
  the header spanned edge to edge, but the hero/cards sat in a narrow
  block hugging the left edge with a large dead dark area on the right —
  not actually centered despite `margin: 0 auto`, because the flex item
  itself was never full-width to begin with.
- **Fix**: added `width: 100%;` to `.landing-page` in `globals.css`.
- **Verified**: re-screenshotted at full width (~1446px) in an actual
  Chrome tab — header and content now both span the full width, hero
  section properly centered with balanced margins either side. Also
  confirmed via `window.innerWidth`/`outerWidth` mismatch during
  investigation that this was a genuine layout bug, not a screenshot/DPI
  artifact (a `resize_window` call to a narrow width was tried first while
  chasing this, which was itself unreliable in this environment and is not
  the fix — the actual fix is the CSS change above, confirmed at real
  laptop width).
- `npx tsc --noEmit` clean after both fixes.
