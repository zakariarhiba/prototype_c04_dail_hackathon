"""
Narrative service (C04 prototype). See docs/01-system-design.md §6/§9.

Scope, on purpose: this service ONLY turns already-computed classification /
reconciliation facts into a human-readable sentence via Gemini. It never
decides NEW vs DUPLICATE vs AMBIGUOUS, and never computes the reconciliation
numbers - that stays deterministic TypeScript in the Next.js app. If this
service is down, unreachable, or GEMINI_API_KEY is unset, callers are
expected to fall back to their own templated sentence, labeled as such.
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END

load_dotenv()

app = FastAPI(title="C04 narrative service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class NarrateRequest(BaseModel):
    kind: str  # "classification" | "reconciliation"
    facts: dict
    fallback_text: str


class NarrateResponse(BaseModel):
    text: str
    source: str  # "gemini" | "fallback"


class GraphState(TypedDict):
    kind: str
    facts: dict
    fallback_text: str
    text: str
    source: str


def _build_prompt(kind: str, facts: dict) -> str:
    if kind == "classification":
        return (
            "You are writing a one or two sentence explanation for a "
            "warehouse receiving clerk, describing why an incoming delivery "
            "scan was flagged the way it was. Be concrete, reference the "
            "actual numbers given, and do not invent facts not in the data "
            "below. Do not use an em dash character.\n\n"
            f"Classification: {facts.get('classification')}\n"
            f"PO: {facts.get('order_id')}, Part: {facts.get('part')}\n"
            f"Listed quantity on this scan: {facts.get('listed_quantity')}\n"
            f"Matched existing delivery note: {facts.get('matched_delivery_note')}\n"
            f"Already logged for this PO/part: {facts.get('already_logged')} of "
            f"{facts.get('ordered_quantity')} ordered\n"
        )
    return (
        "You are writing a one or two sentence explanation for an invoice "
        "approver, describing why an invoice does or does not reconcile "
        "against what was actually received. Be concrete, reference the "
        "actual numbers given, and do not invent facts not in the data "
        "below. Do not use an em dash character.\n\n"
        f"Invoiced quantity: {facts.get('invoiced_quantity')}\n"
        f"Sum of accepted across linked delivery notes: {facts.get('accepted_total')}\n"
        f"Discrepancy: {facts.get('discrepancy')}\n"
        f"Evidence lines: {facts.get('evidence')}\n"
    )


def _generate(state: GraphState) -> GraphState:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {**state, "text": state["fallback_text"], "source": "fallback"}

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        model = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=api_key)
        prompt = _build_prompt(state["kind"], state["facts"])
        result = model.invoke(prompt)
        text = (result.content or "").strip() if hasattr(result, "content") else str(result).strip()
        if not text:
            return {**state, "text": state["fallback_text"], "source": "fallback"}
        return {**state, "text": text, "source": "gemini"}
    except Exception:
        return {**state, "text": state["fallback_text"], "source": "fallback"}


_graph = StateGraph(GraphState)
_graph.add_node("generate", _generate)
_graph.add_edge(START, "generate")
_graph.add_edge("generate", END)
_compiled = _graph.compile()


@app.post("/narrate", response_model=NarrateResponse)
def narrate(req: NarrateRequest) -> NarrateResponse:
    result = _compiled.invoke(
        {
            "kind": req.kind,
            "facts": req.facts,
            "fallback_text": req.fallback_text,
            "text": "",
            "source": "",
        }
    )
    return NarrateResponse(text=result["text"], source=result["source"])


@app.get("/health")
def health() -> dict:
    return {"ok": True, "gemini_configured": bool(os.environ.get("GEMINI_API_KEY"))}
