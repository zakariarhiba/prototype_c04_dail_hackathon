# Phase 16 — Pre-filled demo login

## What was asked

Zakaria: he's presenting the whole demo from one account (`priya_lead`)
— add the username/password to the login form by default, with a
notice that they're pre-set, so he doesn't have to type or copy-paste
credentials live during the presentation.

## Note on phase-gate status

Phases 13-15 are still awaiting Zakaria's explicit validation. As with
14 and 15, this is a small, direct, explicit ask handled ahead of those
reviews — not a precedent for skipping the gate going forward.

## What changed

- `app/app/login/page.tsx` — the `username`/`password` `useState`
  initial values changed from `""`/`""` to `"priya_lead"`/`"@Passw0rd1"`
  (one of the two demo users already seeded by `resetState()`, see
  `docs/01-system-design.md` §10). Added a small
  `etiquette-statut--info` badge under the "Log in to access your
  workspace" intro line reading "Demo credentials pre-filled — just
  click Log in", so it's visibly not a real saved-password autofill.
- No design-doc change needed — this doesn't alter any documented
  behavior, just the form's default field values, for a prototype whose
  auth is explicitly demo-only (§10 already documents "no password
  policy, recovery, or OAuth/SSO").

## How it was verified

- `npx tsc --noEmit -p .` and `npx eslint app/login/page.tsx` — both
  clean.
- Not re-checked live in a browser this round, per Zakaria's standing
  instruction not to use browser automation for this work. Worth a
  30-second manual check: `npm run dev`, open `/login`, confirm both
  fields already show the demo values and the note renders, click Log
  in with no typing, land on `/dashboard` as Priya.

## Known gaps / open items

- Fields are still editable — pre-filling doesn't lock them, so if
  someone wants to demo as `sam_lead` instead they just overwrite it
  (documented behavior, not a bug: the ask was "no need to copy-paste,"
  not "lock to one account").
- Not yet manually re-verified in a running browser (see above).
