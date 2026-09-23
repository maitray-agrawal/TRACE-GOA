# TRACE//GOA — LLM Runtime Reality & Provider Status

## 1. Executive Status

```text
REAL LLM CONFIGURED: NO
ACTIVE LLM PROVIDER: DETERMINISTIC_RULES (Offline Rule Engine)
RUNTIME MODE: DETERMINISTIC_TEST_MODE
GEMINI API KEY: NOT CONFIGURED
OPENAI API KEY: NOT CONFIGURED
LOCAL LLM ENDPOINT: NOT CONFIGURED
```

---

## 2. Classification

```text
CURRENT LLM SUBSYSTEM: DETERMINISTIC RULE ENGINE
```

> **Official Declaration:**
> The current execution environment does not have active `GEMINI_API_KEY` or `OPENAI_API_KEY` credentials set.
>
> In accordance with Prompt Section 10, the system operates in **`DETERMINISTIC_TEST_MODE`** using deterministic pattern rules, programmatic PolicyEngine logic, and structured GraphRAG templates.
>
> It does **NOT** claim autonomous neural generation or live frontier LLM reasoning until valid API credentials are supplied.

---

## 3. Provider Architecture

TRACE//GOA enforces a clean provider abstraction located in `backend/app/llm/provider.py`:

```text
LLMProvider (BaseLLMProvider)
├── GeminiLLMProvider (Requires GEMINI_API_KEY -> AGENTIC_LIVE_MODE)
├── OpenAILLMProvider (Requires OPENAI_API_KEY -> AGENTIC_LIVE_MODE)
└── DeterministicFallbackProvider (Zero-API Key -> DETERMINISTIC_TEST_MODE)
```

### Mode Comparison:

| Feature / Behavior | `AGENTIC_LIVE_MODE` | `DETERMINISTIC_TEST_MODE` (Current) |
|--------------------|---------------------|-----------------------------------|
| **Tool Planning** | Dynamic prompt evaluation via frontier LLM | Deterministic branch logic based on risk/amount |
| **Evidence Synthesis** | Generative narrative summary | Structured template synthesis matching Section 11 |
| **Policy Clearance** | Enforced by PolicyEngine gatekeeper | Enforced by PolicyEngine gatekeeper |
| **Decision Ledger** | SHA-256 chained audit entries | SHA-256 chained audit entries |
| **API Costs / Network** | Requires egress HTTP calls | 100% offline, zero network dependency |

---

## 4. Enabling Live Mode

To transition TRACE//GOA from `DETERMINISTIC_TEST_MODE` to `AGENTIC_LIVE_MODE`:
```bash
# Set your Gemini API key in your environment or .env file
export GEMINI_API_KEY="AIzaSy..."
# or
export OPENAI_API_KEY="sk-..."
```
The application will automatically detect the presence of credentials and transition the runtime mode without code changes.
