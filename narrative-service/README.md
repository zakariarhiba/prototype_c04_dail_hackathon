# Narrative service

Small Python + LangGraph service used by the Next.js app to turn
already-computed classification/reconciliation facts into a human-readable
sentence via Gemini. See `docs/01-system-design.md` §6/§9 for why this is
scoped this narrowly (it never makes the NEW/DUPLICATE/AMBIGUOUS or
reconciliation decision itself).

## Run

```bash
cd narrative-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then set GEMINI_API_KEY
uvicorn app:app --port 8000
```

Without `GEMINI_API_KEY` set, `/narrate` still responds, echoing back the
caller's own `fallback_text` with `"source": "fallback"` instead of calling
Gemini. The Next.js app is built to work fine either way.

## Endpoints

- `POST /narrate` — body `{ kind, facts, fallback_text }`, returns
  `{ text, source }` where `source` is `"gemini"` or `"fallback"`.
- `GET /health` — `{ ok, gemini_configured }`.
