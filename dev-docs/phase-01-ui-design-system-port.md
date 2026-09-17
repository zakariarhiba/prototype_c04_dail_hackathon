# Phase 1 — UI design system port

**Status: awaiting review** (written retroactively, before the phase-gate
workflow existed — see `dev-docs/README.md`)

## What was asked

Reuse the look and mechanics of Zakaria's Tibnexis frontend system (via the
`zakpy-frontend` skill) for this prototype, but in this app's actual stack —
Next.js/React/TypeScript — not the skill's own reference stack
(FastAPI + Jinja2 + htmx).

## What changed

- `app/app/globals.css` — rewritten. Added the Tibnexis CSS variable system
  (`--color-bg`, `--color-surface`, `--color-text`, `--color-primary`,
  status-color pairs like `--color-succes-bg`/`-text`, spacing scale), light
  theme + `@media (prefers-color-scheme: dark)` dark theme, and component
  classes ported from the reference stylesheet: `.bouton`/`.bouton--secondaire`/
  `.bouton--danger`, `.carte`/`.carte-lien`, `.tableau`/`.tableau-conteneur`,
  `.etiquette-statut` (+ succes/attention/danger/info/neutre variants),
  `.champ`/`.champ-groupe` (form fields), `.message` (banners),
  `.app-sidebar`/`.app-nav`/`.app-topbar`/`.app-main` (shell).
- `app/app/layout.tsx` — sidebar + mobile topbar shell (later replaced by
  the auth-gated version in phase 2).
- `app/app/page.tsx`, `app/app/receiving/page.tsx`,
  `app/app/invoices/page.tsx`, `app/app/components/ResetButton.tsx` —
  Tailwind utility classes (bg-*, border-*, rounded, text-* colors) replaced
  with the new semantic classes above. Layout utilities (flex, grid, spacing)
  were left on Tailwind rather than reinvented.

## Why this shape

- The skill's reference stack doesn't apply directly (no FastAPI/Jinja2/htmx
  here), so only the design system itself was ported — CSS tokens and
  component class contracts — translated to React, not the server-rendered
  templates or htmx wiring.
- Kept Tailwind for generic layout (it was already wired up and works fine
  alongside the new component classes); only replaced the parts Tibnexis has
  actual opinions about (buttons, tables, cards, badges, forms, the shell).

## How it was verified

- `npx tsc --noEmit` clean.
- Dev server started, `curl` against `/`, `/receiving`, `/invoices` returned
  200 with no error markers in the HTML.
- Not verified: actual visual inspection in a browser (only checked
  programmatically via curl/type-check, not screenshotted).

## Known gaps / open items

- No visual QA screenshot was taken and reviewed by Zakaria before this
  point in the conversation — that's the main reason this phase needs
  retroactive review now.
- Dark mode was only exercised via `prefers-color-scheme`, not manually
  toggled at this point (a toggle was added in phase 2).
