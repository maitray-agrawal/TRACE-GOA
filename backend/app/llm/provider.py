"""LLM Provider Abstraction Layer for TRACE//GOA.

Distinguishes between:
- AGENTIC_LIVE_MODE (Real Gemini / OpenAI API with configured credentials)
- DETERMINISTIC_TEST_MODE (Offline deterministic synthesis using rule engines)
"""

from typing import Any, Dict, List, Optional
import os
import json
import logging
from abc import ABC, abstractmethod

logger = logging.getLogger("LLMProvider")


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def runtime_mode(self) -> str:
        """Returns AGENTIC_LIVE_MODE or DETERMINISTIC_TEST_MODE."""
        pass

    @abstractmethod
    def generate_investigation_plan(self, case_context: Dict[str, Any]) -> List[str]:
        """Generates dynamic tool execution plan."""
        pass

    @abstractmethod
    def synthesize_narrative(self, prompt: str, evidence_pack: Dict[str, Any]) -> str:
        """Synthesizes human-readable investigation findings and evidence summary."""
        pass


class GeminiLLMProvider(BaseLLMProvider):
    """Real Google Gemini LLM Provider."""

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name

    @property
    def provider_name(self) -> str:
        return f"GEMINI ({self.model_name})"

    @property
    def runtime_mode(self) -> str:
        return "AGENTIC_LIVE_MODE"

    def generate_investigation_plan(self, case_context: Dict[str, Any]) -> List[str]:
        # Formulate live prompt and invoke Gemini API
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": f"Select tool plan for fraud case: {json.dumps(case_context)}"}]
                }]
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    text = res.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return [w.strip() for w in text.split(",") if w.strip()]
        except Exception as e:
            logger.warning(f"Gemini live call error, falling back: {e}")
        return ["query_neighborhood", "find_shared_entities", "detect_patterns"]

    def synthesize_narrative(self, prompt: str, evidence_pack: Dict[str, Any]) -> str:
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": f"{prompt}\nEvidence:\n{json.dumps(evidence_pack)}"}]
                }]
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    return res.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        except Exception as e:
            logger.warning(f"Gemini live call error: {e}")
        return "Autonomous LLM narrative synthesis unavailable. Fallback rule assessment applied."


class OpenAILLMProvider(BaseLLMProvider):
    """Real OpenAI LLM Provider."""

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name

    @property
    def provider_name(self) -> str:
        return f"OPENAI ({self.model_name})"

    @property
    def runtime_mode(self) -> str:
        return "AGENTIC_LIVE_MODE"

    def generate_investigation_plan(self, case_context: Dict[str, Any]) -> List[str]:
        try:
            import httpx
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": "You are a fraud investigation planner. Output comma-separated tool names."},
                    {"role": "user", "content": f"Case context: {json.dumps(case_context)}"}
                ]
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    content = res.json()["choices"][0]["message"]["content"]
                    return [w.strip() for w in content.split(",") if w.strip()]
        except Exception as e:
            logger.warning(f"OpenAI live call error: {e}")
        return ["query_neighborhood", "find_shared_entities", "detect_patterns"]

    def synthesize_narrative(self, prompt: str, evidence_pack: Dict[str, Any]) -> str:
        try:
            import httpx
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": "You are a fraud investigation specialist."},
                    {"role": "user", "content": f"{prompt}\nEvidence: {json.dumps(evidence_pack)}"}
                ]
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"OpenAI live call error: {e}")
        return "Autonomous LLM narrative synthesis unavailable."


class DeterministicFallbackProvider(BaseLLMProvider):
    """Deterministic Rule-Based Engine for offline test and local evaluation."""

    @property
    def provider_name(self) -> str:
        return "DETERMINISTIC_RULES"

    @property
    def runtime_mode(self) -> str:
        return "DETERMINISTIC_TEST_MODE"

    def generate_investigation_plan(self, case_context: Dict[str, Any]) -> List[str]:
        txn_amount = float(case_context.get("amount", 0.0))
        initial_risk = float(case_context.get("risk_score", 0.50))
        customer_id = case_context.get("customer_id")

        plan = ["query_neighborhood"]
        if txn_amount >= 5000.0 or initial_risk >= 0.70:
            plan.append("query_centrality")
        if customer_id:
            plan.append("find_shared_entities")
        plan.append("detect_patterns")
        return plan

    def synthesize_narrative(self, prompt: str, evidence_pack: Dict[str, Any]) -> str:
        case_id = evidence_pack.get("case_id", "UNKNOWN")
        patterns = [p.get("pattern_id") for p in evidence_pack.get("fraud_patterns", []) if isinstance(p, dict)]
        return f"Deterministic finding for {case_id}: Evaluated against 5 canonical fraud typologies. Identified patterns: {', '.join(patterns) or 'NONE'}."


_GLOBAL_LLM_PROVIDER: Optional[BaseLLMProvider] = None

def get_llm_provider() -> BaseLLMProvider:
    """Returns active LLM provider based on configured API credentials."""
    global _GLOBAL_LLM_PROVIDER
    if _GLOBAL_LLM_PROVIDER is None:
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if gemini_key and not gemini_key.startswith("your_"):
            logger.info("Initializing GeminiLLMProvider (AGENTIC_LIVE_MODE)")
            _GLOBAL_LLM_PROVIDER = GeminiLLMProvider(api_key=gemini_key)
        elif openai_key and not openai_key.startswith("your_"):
            logger.info("Initializing OpenAILLMProvider (AGENTIC_LIVE_MODE)")
            _GLOBAL_LLM_PROVIDER = OpenAILLMProvider(api_key=openai_key)
        else:
            logger.info("No LLM API keys configured. Activating DeterministicFallbackProvider (DETERMINISTIC_TEST_MODE)")
            _GLOBAL_LLM_PROVIDER = DeterministicFallbackProvider()

    return _GLOBAL_LLM_PROVIDER
