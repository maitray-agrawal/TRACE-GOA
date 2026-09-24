"""
LLM Provider — TRACE//GOA.

Three operation modes:
- GeminiLLMProvider   : Live Google Gemini (google-genai SDK, temperature=0).
                        Caches every response to cache/llm/<key>.json.
                        Records total_token_count from usage_metadata.
- DeterministicProvider: Rule-based, no API calls (tests / GRAPH_BACKEND=simulator).

The GeminiLLMProvider exposes three structured entry points used by the benchmark:

  plan_tools(case_ctx)          → List[str]  tool names in order
  decide_enough_to_act(ev_ctx)  → {enough, verdict, confidence, explanation}
  write_explanation(case_ctx)   → str        human-readable reasoning

Every call is logged to cache/llm/ with:
  model, call_type, case_id, prompt_tokens, completion_tokens, total_tokens,
  latency_ms, cached (bool), response
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

logger = logging.getLogger("LLMProvider")

# ---------------------------------------------------------------------------
# Cache directory — committed empty via .gitkeep; responses cached at runtime
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
CACHE_DIR = BASE_DIR / "cache" / "llm"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
(CACHE_DIR / ".gitkeep").touch(exist_ok=True)


def _cache_key(call_type: str, case_id: str, prompt_hash: str) -> Path:
    return CACHE_DIR / f"{case_id}_{call_type}_{prompt_hash}.json"


def _hash(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Base class
# ---------------------------------------------------------------------------
class BaseLLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str: ...

    @property
    @abstractmethod
    def runtime_mode(self) -> str: ...

    @abstractmethod
    def plan_tools(self, case_ctx: dict) -> list[str]:
        """Return ordered list of MCP tool names to call for this case."""
        ...

    @abstractmethod
    def decide_enough_to_act(self, evidence_ctx: dict) -> dict:
        """
        Returns:
          {enough: bool, verdict: str, confidence: float,
           explanation: str, model: str, tokens: int}
        """
        ...

    @abstractmethod
    def write_explanation(self, case_ctx: dict) -> str:
        """Human-readable investigation narrative."""
        ...

    # Legacy compat
    def generate_investigation_plan(self, case_context: dict) -> list[str]:
        return self.plan_tools(case_context)

    def synthesize_narrative(self, prompt: str, evidence_pack: dict) -> str:
        return self.write_explanation({**evidence_pack, "prompt_hint": prompt})


# ---------------------------------------------------------------------------
# Gemini provider (live, temperature=0, cached)
# ---------------------------------------------------------------------------
class GeminiLLMProvider(BaseLLMProvider):
    """Real Google Gemini provider using google-genai SDK."""

    PLAN_TOOLS_SCHEMA = {
        "type": "array",
        "items": {"type": "string"},
        "description": "Ordered list of MCP tool names to call"
    }

    ENOUGH_TO_ACT_SCHEMA = {
        "type": "object",
        "properties": {
            "enough": {"type": "boolean"},
            "verdict": {"type": "string", "enum": ["fraud", "legitimate", "uncertain"]},
            "confidence": {"type": "number"},
            "explanation": {"type": "string"}
        },
        "required": ["enough", "verdict", "confidence", "explanation"]
    }

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    @property
    def provider_name(self) -> str:
        return f"GEMINI ({self.model_name})"

    @property
    def runtime_mode(self) -> str:
        return "AGENTIC_LIVE_MODE"

    def _call(
        self,
        call_type: str,
        case_id: str,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict | None = None,
    ) -> dict:
        """
        Makes a Gemini API call with caching and token recording.
        Returns: {response: Any, tokens: int, latency_ms: float, cached: bool, model: str}
        """
        payload_for_hash = {"system": system_prompt, "user": user_prompt}
        cache_file = _cache_key(call_type, case_id, _hash(payload_for_hash))

        if cache_file.exists():
            cached = json.loads(cache_file.read_text())
            cached["cached"] = True
            logger.info(f"[{case_id}] {call_type}: cache hit ({cache_file.name})")
            return cached

        from google import genai
        from google.genai import types

        client = self._get_client()
        t0 = time.perf_counter()

        config_kwargs: dict = {
            "temperature": 0,
            "system_instruction": system_prompt,
        }
        if response_schema:
            config_kwargs["response_mime_type"] = "application/json"
            config_kwargs["response_schema"] = response_schema

        try:
            resp = client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(**config_kwargs),
            )
            latency_ms = round((time.perf_counter() - t0) * 1000, 1)
            raw_text = resp.text or ""
            tokens = (resp.usage_metadata.total_token_count
                      if resp.usage_metadata else 0)

            result = {
                "response": raw_text,
                "tokens": tokens,
                "prompt_tokens": (resp.usage_metadata.prompt_token_count
                                  if resp.usage_metadata else 0),
                "completion_tokens": (resp.usage_metadata.candidates_token_count
                                      if resp.usage_metadata else 0),
                "latency_ms": latency_ms,
                "model": self.model_name,
                "cached": False,
                "call_type": call_type,
                "case_id": case_id,
            }
            cache_file.write_text(json.dumps(result, indent=2))
            logger.info(f"[{case_id}] {call_type}: {tokens} tokens, {latency_ms}ms")
            return result

        except Exception as e:
            latency_ms = round((time.perf_counter() - t0) * 1000, 1)
            logger.error(f"[{case_id}] {call_type}: Gemini API error: {e}")
            raise

    def plan_tools(self, case_ctx: dict) -> list[str]:
        case_id = case_ctx.get("case_id", "UNKNOWN")
        system = (
            "You are a fraud investigation tool planner for an agentic system. "
            "Given a case context, return an ordered JSON array of MCP tool names to call. "
            "Available tools: query_neighborhood, detect_device_reuse, detect_ip_reuse, "
            "check_shared_identity, get_temporal_velocity, find_similar_cases. "
            "Always start with query_neighborhood. "
            "Add detect_device_reuse if identity data shows a device. "
            "Add get_temporal_velocity if the risk score is ambiguous (0.50-0.80). "
            "Add find_similar_cases always. Return ONLY a JSON array of strings."
        )
        user = f"Case context:\n{json.dumps(case_ctx, indent=2)}"
        result = self._call("plan_tools", case_id, system, user,
                            response_schema={"type": "array", "items": {"type": "string"}})
        try:
            tools = json.loads(result["response"])
            if not isinstance(tools, list):
                raise ValueError("Not a list")
            # Guarantee query_neighborhood is first and find_similar_cases is last
            if "query_neighborhood" not in tools:
                tools = ["query_neighborhood"] + tools
            if "find_similar_cases" not in tools:
                tools.append("find_similar_cases")
            result["_tools"] = tools
            return tools
        except Exception as e:
            logger.warning(f"[{case_id}] plan_tools parse error: {e}. Using safe default.")
            return ["query_neighborhood", "detect_device_reuse", "get_temporal_velocity", "find_similar_cases"]

    def decide_enough_to_act(self, evidence_ctx: dict) -> dict:
        case_id = evidence_ctx.get("case_id", "UNKNOWN")
        system = (
            "You are a fraud investigation decision engine. "
            "Given investigation evidence, decide whether there is ENOUGH evidence to act decisively "
            "(verdict = fraud OR legitimate), or whether evidence is still insufficient (verdict = uncertain). "
            "\n\nStopping rules:\n"
            "- fraud: fraud_probability >= 0.85 with >= 2 independent evidence sources, "
            "OR customer explicitly denied AND risk_score >= 0.70\n"
            "- legitimate: fraud_probability <= 0.15 OR customer explicitly confirmed\n"
            "- uncertain: everything else — request more evidence\n"
            "\nA non-response is NOT proof of fraud. Never elevate uncertainty to fraud on absence of response alone.\n"
            "\nReturn a JSON object with: enough (bool), verdict (fraud|legitimate|uncertain), "
            "confidence (0.0-1.0), explanation (1-2 sentence clear reasoning)."
        )
        user = f"Investigation evidence:\n{json.dumps(evidence_ctx, indent=2)}"
        result = self._call("decide_enough_to_act", case_id, system, user,
                            response_schema={
                                "type": "object",
                                "properties": {
                                    "enough": {"type": "boolean"},
                                    "verdict": {"type": "string"},
                                    "confidence": {"type": "number"},
                                    "explanation": {"type": "string"}
                                },
                                "required": ["enough", "verdict", "confidence", "explanation"]
                            })
        try:
            parsed = json.loads(result["response"])
            if not isinstance(parsed, dict):
                raise ValueError("Not an object")
            parsed.setdefault("enough", False)
            parsed.setdefault("verdict", "uncertain")
            parsed.setdefault("confidence", evidence_ctx.get("fraud_probability", 0.5))
            parsed.setdefault("explanation", "Insufficient evidence to determine verdict.")
        except Exception as e:
            logger.warning(f"[{case_id}] decide_enough_to_act parse error: {e}")
            parsed = {
                "enough": False,
                "verdict": "uncertain",
                "confidence": evidence_ctx.get("fraud_probability", 0.5),
                "explanation": f"Parse error in LLM response: {e}"
            }
        return {
            **parsed,
            "model": result["model"],
            "tokens": result["tokens"],
            "latency_ms": result["latency_ms"],
            "cached": result["cached"],
        }

    def write_explanation(self, case_ctx: dict) -> str:
        case_id = case_ctx.get("case_id", "UNKNOWN")
        system = (
            "You are a fraud investigation analyst. Write a concise (2-4 sentence) "
            "plain-English explanation of the investigation findings and the rationale for the recommended action. "
            "Be specific about the evidence that led to the verdict. "
            "Do NOT use placeholders or generic language. "
            "Do NOT mention internal system names."
        )
        user = f"Investigation summary:\n{json.dumps(case_ctx, indent=2)}"
        result = self._call("write_explanation", case_id, system, user)
        return result["response"].strip()


# ---------------------------------------------------------------------------
# Deterministic fallback (tests / simulator mode)
# ---------------------------------------------------------------------------
class DeterministicFallbackProvider(BaseLLMProvider):
    """Rule-based offline provider — no API calls. Used when GRAPH_BACKEND=simulator."""

    @property
    def provider_name(self) -> str:
        return "DETERMINISTIC_RULES"

    @property
    def runtime_mode(self) -> str:
        return "DETERMINISTIC_TEST_MODE"

    def plan_tools(self, case_ctx: dict) -> list[str]:
        tools = ["query_neighborhood"]
        if case_ctx.get("has_identity"):
            tools.append("detect_device_reuse")
        risk = float(case_ctx.get("risk_score", 0.5))
        if 0.50 <= risk <= 0.80:
            tools.append("get_temporal_velocity")
        tools.append("find_similar_cases")
        return tools

    def decide_enough_to_act(self, evidence_ctx: dict) -> dict:
        prob = float(evidence_ctx.get("fraud_probability", 0.5))
        customer_denied = evidence_ctx.get("customer_denied", False)
        customer_confirmed = evidence_ctx.get("customer_confirmed", False)
        n_sources = evidence_ctx.get("n_evidence_sources", 1)

        if customer_confirmed or prob <= 0.15:
            verdict, enough, conf = "legitimate", True, max(0.10, 1.0 - prob)
        elif (prob >= 0.85 and n_sources >= 2) or (customer_denied and prob >= 0.70):
            verdict, enough, conf = "fraud", True, prob
        else:
            verdict, enough, conf = "uncertain", False, prob

        return {
            "enough": enough, "verdict": verdict, "confidence": conf,
            "explanation": f"Deterministic rule: prob={prob:.2f}, sources={n_sources}, "
                           f"confirmed={customer_confirmed}, denied={customer_denied}.",
            "model": "DETERMINISTIC_RULES", "tokens": 0, "latency_ms": 0.0, "cached": False
        }

    def write_explanation(self, case_ctx: dict) -> str:
        case_id = case_ctx.get("case_id", "UNKNOWN")
        verdict = case_ctx.get("verdict", "uncertain")
        pattern = case_ctx.get("pattern", "none")
        prob = case_ctx.get("fraud_probability", 0.0)
        return (
            f"Deterministic investigation of {case_id} yielded verdict {verdict.upper()} "
            f"(pattern: {pattern}, fraud_probability: {prob:.2f}). "
            f"Decision driven by rule-based policy engine without LLM reasoning."
        )

    # Legacy compat
    def generate_investigation_plan(self, case_context: dict) -> list[str]:
        return self.plan_tools(case_context)

    def synthesize_narrative(self, prompt: str, evidence_pack: dict) -> str:
        return self.write_explanation(evidence_pack)


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------
_GLOBAL_LLM_PROVIDER: BaseLLMProvider | None = None


def get_llm_provider(force_deterministic: bool = False) -> BaseLLMProvider:
    """Returns active LLM provider.

    - force_deterministic=True (tests)     → DeterministicFallbackProvider
    - LLM_PROVIDER=deterministic           → DeterministicFallbackProvider
    - GEMINI_API_KEY set + not placeholder → GeminiLLMProvider
    - Otherwise                            → DeterministicFallbackProvider
    """
    global _GLOBAL_LLM_PROVIDER
    if _GLOBAL_LLM_PROVIDER is None or force_deterministic:
        llm_provider_env = os.getenv("LLM_PROVIDER", "").lower()
        if force_deterministic or llm_provider_env == "deterministic":
            provider = DeterministicFallbackProvider()
            if force_deterministic:
                return provider
            _GLOBAL_LLM_PROVIDER = provider
        else:
            gemini_key = os.getenv("GEMINI_API_KEY", "")
            model_name = os.getenv("LLM_MODEL", "gemini-2.5-flash")
            if gemini_key and not gemini_key.startswith("your_") and not gemini_key.startswith("YOUR_"):
                logger.info(f"GeminiLLMProvider initialized: model={model_name}")
                _GLOBAL_LLM_PROVIDER = GeminiLLMProvider(api_key=gemini_key, model_name=model_name)
            else:
                logger.warning("GEMINI_API_KEY missing - using DeterministicFallbackProvider")
                _GLOBAL_LLM_PROVIDER = DeterministicFallbackProvider()
    return _GLOBAL_LLM_PROVIDER


def reset_llm_provider() -> None:
    global _GLOBAL_LLM_PROVIDER
    _GLOBAL_LLM_PROVIDER = None
