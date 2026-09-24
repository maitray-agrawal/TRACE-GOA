"""
check_env.py — Environment validation for TRACE//GOA.

Called before any live benchmark run. Fails loudly with actionable instructions
if required credentials are missing or still contain placeholder values.
"""

import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

REQUIRED_KEYS = {
    "TIGERGRAPH_HOST": "TigerGraph Savanna hostname, e.g. https://workspace.i.tgcloud.io",
    "TIGERGRAPH_USERNAME": "TigerGraph username, usually 'tigergraph'",
    "TIGERGRAPH_PASSWORD": "TigerGraph password",
    "TIGERGRAPH_GRAPH": "Graph name, e.g. FraudInvestigationGraph",
    "GEMINI_API_KEY": "Google Gemini API key (AIza...)",
}

PLACEHOLDER_PREFIXES = ("your_", "YOUR_", "https://your-", "https://YOUR-")


def check_env(require_graph: bool = True, require_llm: bool = True) -> dict:
    """
    Validates .env is present and all required keys have real values.
    Returns the loaded environment dict on success.
    Raises SystemExit with actionable message on failure.
    """
    if not ENV_FILE.exists():
        print(f"""
[FATAL] .env file not found at {ENV_FILE}

To proceed:
  cp .env.example .env
  # Edit .env and fill in real credentials

Required keys:
""")
        for k, desc in REQUIRED_KEYS.items():
            print(f"  {k}={desc}")
        print("""
GRAPH_BACKEND=tigergraph
LLM_PROVIDER=gemini
""")
        sys.exit(1)

    # Load .env manually (avoid circular dotenv import issues in some contexts)
    env_values = {}
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env_values[k.strip()] = v.strip().strip('"').strip("'")

    # Also check os.environ (may be set externally)
    for k in REQUIRED_KEYS:
        if k not in env_values:
            env_values[k] = os.environ.get(k, "")

    errors = []

    if require_graph:
        for key in ("TIGERGRAPH_HOST", "TIGERGRAPH_USERNAME", "TIGERGRAPH_PASSWORD", "TIGERGRAPH_GRAPH"):
            val = env_values.get(key, "")
            if not val:
                errors.append(f"  MISSING: {key} — {REQUIRED_KEYS.get(key, '')}")
            elif any(val.startswith(p) for p in PLACEHOLDER_PREFIXES):
                errors.append(f"  PLACEHOLDER: {key}={val!r} — replace with real value")

        graph_backend = env_values.get("GRAPH_BACKEND", os.environ.get("GRAPH_BACKEND", ""))
        if graph_backend and graph_backend != "tigergraph":
            errors.append(
                f"  GRAPH_BACKEND={graph_backend!r} — must be 'tigergraph' for live benchmark "
                "(use --test flag to run in simulator mode)"
            )

    if require_llm:
        gemini_key = env_values.get("GEMINI_API_KEY", "")
        if not gemini_key:
            errors.append(f"  MISSING: GEMINI_API_KEY — {REQUIRED_KEYS['GEMINI_API_KEY']}")
        elif any(gemini_key.startswith(p) for p in PLACEHOLDER_PREFIXES):
            errors.append(f"  PLACEHOLDER: GEMINI_API_KEY={gemini_key!r} — replace with real key")

    if errors:
        print(f"\n[FATAL] .env validation failed ({len(errors)} error(s)):\n")
        for e in errors:
            print(e)
        print(f"\nEdit {ENV_FILE} and fix the above before running the live benchmark.")
        sys.exit(1)

    print(f"[OK] .env validated — TigerGraph: {env_values.get('TIGERGRAPH_HOST', '?')} | "
          f"Graph: {env_values.get('TIGERGRAPH_GRAPH', '?')} | "
          f"LLM: {'GEMINI' if env_values.get('GEMINI_API_KEY') else 'MISSING'}")
    return env_values


if __name__ == "__main__":
    env = check_env()
    print("\n[OK] Environment ready for live benchmark.")
