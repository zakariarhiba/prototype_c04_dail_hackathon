# Phase 3 — Python/LangGraph/Gemini narrative service (built, then paused)

**Status: awaiting review** (written retroactively — see `dev-docs/README.md`)

## What was asked

The event mandates a fixed toolset: Claude Code, Next.js, LangGraph, Python,
Supabase, Gemini. Decided (with Zakaria) on the narrowest integration that
still genuinely exercises LangGraph/Python/Gemini: a small service that
turns already-computed classification/reconciliation facts into a
human-readable sentence, never in the decision path itself. Later in the
same conversation, Zakaria said not to use Gemini/an LLM right now ("it's
just a prototype") — so this was built, then disconnected rather than
deleted.

## What changed

- `narrative-service/` (new directory):
  - `app.py` — FastAPI app, one endpoint `POST /narrate`. Body
    `{ kind, facts, fallback_text }`. Runs a one-node LangGraph graph
    (`StateGraph` → `generate` node → `END`) that calls
    `ChatGoogleGenerativeAI` (`gemini-2.0-flash`) if `GEMINI_API_KEY` is
    set, otherwise returns `fallback_text` unchanged with
    `"source": "fallback"`. Any exception during the Gemini call is caught
    and also falls back — the endpoint never 500s because of the model.
  - `requirements.txt`, `.env.example`, `README.md`.
- Next.js side (added, then reverted in this same phase once told to pause
  it — see below): `app/app/lib/narrative.ts` (fetch wrapper with a 4s
  timeout, swallows all errors), wired into
  `app/app/api/simulate-scan/route.ts` and
  `app/app/api/simulate-invoice/route.ts` to overwrite
  `system_reasoning`/add a `narrative` field, plus `narrative_source` shown
  in the UI (`receiving/page.tsx`, `invoices/page.tsx`).
- **Then paused**: `app/app/lib/narrative.ts` deleted, the two API routes
  reverted to not call it, the UI labels removed, `narrative_source`/
  `narrative` fields removed from `app/app/lib/types.ts`. The
  `narrative-service/` directory itself was left in place, untouched.

## Why this shape

- Keeps the deterministic, auditable classification/reconciliation math
  (the one non-negotiable rule in the brief) completely untouched by an
  LLM — the service only ever rephrases facts already computed elsewhere,
  and any failure of the service/model falls back to the exact same
  templated sentence that existed before this integration.
- Left the code in place rather than deleting it on pause, since the ask
  was "not now", not "never" — reconnecting later is re-adding the two
  `narrate()` calls and the UI label, not rebuilding the service.

## How it was verified

- `pip install -r requirements.txt` into a local venv; `uvicorn` started.
- First attempt bound to port 8000, which was already occupied by an
  unrelated, already-running local application (a real Tibnexis dev
  instance) — uvicorn failed to bind and a test `curl` accidentally hit
  that other app instead. Caught immediately (response body was
  obviously a different app), nothing destructive was sent (a GET and one
  harmless POST), moved the service to port 8010.
- `GET /health` → `{"ok":true,"gemini_configured":false}`.
- `POST /narrate` with no `GEMINI_API_KEY` set → returned the caller's
  `fallback_text` verbatim with `"source":"fallback"`, confirming the
  graph and the fallback path both work without ever calling Gemini.
- Gemini itself was never actually exercised (no API key was available/used
  in this session) — the "gemini" code path is implemented but unverified
  end-to-end.
- After pausing: `npx tsc --noEmit` clean, and the full scan/invoice API
  flow re-tested (see phase 4's verification) to confirm removing the
  wiring didn't break anything.

## Known gaps / open items

- The Gemini path (`ChatGoogleGenerativeAI` call, prompt construction) has
  never actually run against the real API — worth a real smoke test before
  ever presenting this as "working," if it gets reconnected.
- The service is not started as part of any run instructions right now
  (by design, since it's unused) — `narrative-service/README.md` has its
  own standalone run steps if needed later.
