# Phase 15 — Landing page: visual PO-lifecycle workflow diagram

## What was asked

Zakaria: the landing/about page is what he's going to present from, so
make it better and add a visual workflow — "n8n design" style — of the
PO lifecycle from beginning to end, so he can explain it visually
instead of narrating a bullet list.

## Note on phase-gate status

Neither phase 13 nor phase 14 has been recorded as validated by
Zakaria yet. As with phase 14, this is a direct, explicit ask handled
ahead of those reviews — not a precedent for skipping the gate on
future phases.

## What changed

- `docs/01-system-design.md` — added §17, scoping the diagram: which
  8 stages it shows, that it's purely presentational (no new state, no
  new API routes), and that it reuses the existing `etiquette-statut`
  Real/Simulated tagging convention from §6 rather than inventing a new
  visual language.
- `app/app/page.tsx` — added a new "How a PO moves through the system,
  start to end" section between the existing hero/feature-grid section
  and the "About this prototype" section. Renders `WORKFLOW_STAGES` (8
  stage objects: title, one-line body, `Real`/`Simulated`/`Human
  decision` tag) as a horizontally scrollable row of cards connected by
  `→` arrow separators, plus a small legend above it mapping each tag
  to its badge color.
- `app/app/globals.css` — added `.workflow`, `.workflow__track`,
  `.workflow__node`, `.workflow__step`, `.workflow__arrow`,
  `.workflow__legend`. Plain flexbox, `overflow-x: auto` for the
  horizontal scroll, no new dependency (no diagramming library) —
  matches the "n8n design" request's look (node cards + connectors)
  without the weight of an actual canvas library for 8 static boxes.

## The 8 stages shown

1. PO created — Real
2. Outbound scan — Simulated
3. System classifies (new/duplicate/ambiguous) — Real
4. Human confirms receipt — Human decision
5. Ledger + PO status update — Real
6. Invoice arrives, system reconciles — Simulated
7. Human approves or dismisses — Human decision
8. PO closed — Real

Condensed from the design doc's existing state machine (§3),
classification (§4), reconciliation (§5), and PO lifecycle (§15) — this
phase only visualizes that logic, it doesn't change any of it.

## How it was verified

- `npx tsc --noEmit -p .` — clean, no errors.
- `npx eslint app/page.tsx app/globals.css` — no errors (CSS file is
  outside the JS/TS lint config, expected "file ignored" warning only).
- Not re-checked live in a browser this round, per Zakaria's standing
  instruction not to use browser automation for this work — he'll
  verify visually himself. Worth a manual check: `npm run dev`, open
  `/` (or `/` while logged out — the page doesn't require auth), scroll
  the new workflow row left→right at both a laptop width and a narrow
  mobile width to confirm the horizontal-scroll behavior and card
  wrapping look right, and toggle light/dark theme to confirm the card
  border/background tokens read correctly in both.

## Known gaps / open items

- The workflow section's own copy (stage titles/bodies) is English-only
  — not wired into the EN/DE `LanguageProvider` from phase 14. If this
  page is used to present to trast in German, that's a follow-up.
- No animation/interactivity (e.g. click a node to jump to that page) —
  purely a static explainer, as scoped.
- Not yet manually re-verified in a running browser (see above).
