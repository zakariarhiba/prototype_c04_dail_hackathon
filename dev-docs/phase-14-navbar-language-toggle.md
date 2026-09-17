# Phase 14 — Userbar cleanup + EN/DE language toggle

## What was asked

Zakaria: in the small top-right userbar (profile/options row), keep the
notifications bell and the theme toggle as they are, and replace only
the "messages/chat" icon with a toggle that switches the app shell
between English and German — trast (trast.de) is a German client, so
client fit should include being able to demo the shell in German.

**Correction mid-phase:** the first pass wrongly also removed the theme
toggle and the notifications bell (misread of the original request).
Both were restored; only the messages/chat icon was ever meant to be
replaced.

**Scope extension mid-phase:** Zakaria then flagged that the toggle
"doesn't change all the content in all the pages and tables" — the
first pass only translated shell chrome (sidebar/tagline/logout) as
scoped in the original §16. Scope was widened to cover every static UI
string across every page (headings, labels, buttons, table column
headers, status text), leaving only live application data (IDs,
quantities, dates, names, server-generated reasoning text) untranslated
— see §16's revised text and "What changed" below for the final state.

## Note on phase-gate status

Phase 13 (`dev-docs/phase-13-v3-lifecycle-rebuild.md`) has not been
recorded as validated by Zakaria yet. Per `AGENTS.md`'s phase-gate rule
this phase should normally wait, but Zakaria asked for this specific
small change directly ("do that first") ahead of reviewing 13. Treating
this as an explicitly authorized exception for one small, isolated
change — not a precedent to keep building past unvalidated phases.

## What changed

- `docs/01-system-design.md` — §16 documents the userbar trim, the
  language toggle, and its final (full-coverage) scope.
- `app/app/lib/i18n.tsx` (new) — a client-only `LanguageProvider` React
  context, `en`/`de` dictionaries (~130 keys), persisted to
  `localStorage` under `c04_locale` (same pattern as the existing
  `ThemeToggle`'s `c04_theme` key).
- `app/app/layout.tsx` — wrapped the app body in `LanguageProvider`.
- `app/app/(app)/layout.tsx` — `ThemeToggle` and the notifications-bell
  button (`BellIcon`, still `title="Notifications (not wired up)"`)
  are unchanged; the chat/messages icon button was replaced with a
  small `EN`/`DE` text toggle button wired to `useLanguage().toggle`;
  nav/sidebar/tagline/logout strings switched to `t.*` lookups.
- `app/app/globals.css` — added `.app-userbar__icon--lang` (auto width,
  small bold label) alongside the existing `.app-userbar__icon` circular
  icon-button style.
- `app/app/components/ResetButton.tsx` and all seven page components
  (`dashboard`, `receiving`, `invoices`, `inventory`, `parts`, `po`,
  `po/[id]`) — every static string (headings, intro paragraphs, form
  labels/placeholders, buttons, table column headers, status badge
  text) switched from hardcoded English to `t.*` dictionary lookups.
- `app/app/not-found.tsx` (new) — custom 404 page (Zakaria's follow-up
  ask: "quick custom 404 page that returns to dashboard"), styled with
  the existing design tokens, translated via `useLanguage()`, with a
  "Back to dashboard" (`/dashboard`) button. Replaces Next.js's default
  404 for any unknown route under this app.

The landing-page workflow diagram (originally drafted as part of this
phase) turned out to be distinct scope — split out to
`phase-15-landing-workflow-diagram.md`.

## What's intentionally still English (data, not UI copy)

Part/SKU/PO/scan/invoice/receipt identifiers, quantities, dates, user
names, and server-generated free text (`scenario_label`,
`system_reasoning`, evidence `note` fields, the invoice
over/undercharge sentence's numbers) — this is live application data,
not static chrome, so the frontend dictionary doesn't (and shouldn't)
touch it. See §16 for the reasoning; localizing that data would be a
backend content change, tracked separately if ever needed.

## How it was verified

- `npx tsc --noEmit -p .` — clean, no errors (caught and fixed one
  literal-type narrowing issue in the translation dictionary along the
  way: `dict` needed an explicit `Record<Locale, Dict>` type instead of
  `as const`, otherwise TS inferred each locale's object as its own
  literal type instead of the shared `Dict` shape).
- `npx eslint app/\(app\) app/components app/lib` — no new errors
  introduced by this phase's files (the one `react-hooks/set-state-in-
  effect` warning in `i18n.tsx` mirrors the same pre-existing pattern
  already present, unaddressed, in `ThemeToggle.tsx`).
- `grep -c useLanguage` confirms all 7 pages + `ResetButton` import and
  call the hook.
- Earlier in the phase (before the scope extension), the shell-chrome-
  only version was checked live in a browser: logged in as
  `priya_lead`, toggled EN→DE, confirmed sidebar/tagline switched
  while dashboard body correctly stayed English at that scope.
- The full-coverage version (all pages/tables) has **not** been
  re-checked live in a browser this round — Zakaria asked that browser
  automation not be used for this and will verify visually himself.
  Everything above is static verification (types, lint, grep); no
  runtime screenshot confirms the DE strings render correctly on every
  page. Worth a manual pass: `npm run dev`, log in, toggle to DE, click
  through Receiving, Invoice reconciliation, Inventory, Parts & QR, PO
  tracker, and a PO detail page.

## Known gaps / open items

- No `<html lang>` attribute switch on toggle — cosmetic, low priority
  for a demo.
- Language choice is per-browser (`localStorage`), not persisted server
  side or tied to the user account.
- Not yet manually re-verified in a running browser (see above).
