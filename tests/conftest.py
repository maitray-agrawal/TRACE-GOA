import os
import sys
import tempfile
import pytest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Ensure module-level defaults point to temp database before any test or fixture runs
_SESSION_TEMP_DIR = tempfile.TemporaryDirectory()
_SESSION_CASES_DB = os.path.join(_SESSION_TEMP_DIR.name, "session_cases.db")
_SESSION_LEDGER_DB = os.path.join(_SESSION_TEMP_DIR.name, "session_ledger.db")

os.environ["TRACE_CASES_DB"] = _SESSION_CASES_DB
os.environ["TRACE_LEDGER_DB"] = _SESSION_LEDGER_DB
os.environ["TRACE_DATA_DIR"] = _SESSION_TEMP_DIR.name
os.environ["TRACE_MODE"] = "competition"
os.environ["LLM_PROVIDER"] = "deterministic"
os.environ["GRAPH_BACKEND"] = "simulator"

from backend.app.cases.service import reset_case_service
from backend.app.audit.ledger import reset_decision_ledger
from backend.app.graph.mcp_dispatcher import reset_mcp_dispatcher
from scripts.setup.clean_and_seed_cases import sync_competition_cases

# Seed session temp database
sync_competition_cases(db_path=_SESSION_CASES_DB)

@pytest.fixture(autouse=True)
def isolate_test_environment(tmp_path, monkeypatch):
    """Guarantees that no test can write into data/cases.db or production ledgers."""
    test_cases_db = str(tmp_path / "test_cases.db")
    test_ledger_db = str(tmp_path / "test_ledger.db")
    monkeypatch.setenv("TRACE_CASES_DB", test_cases_db)
    monkeypatch.setenv("TRACE_LEDGER_DB", test_ledger_db)
    monkeypatch.setenv("TRACE_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("TRACE_MODE", "competition")
    monkeypatch.setenv("LLM_PROVIDER", "deterministic")
    monkeypatch.setenv("GRAPH_BACKEND", "simulator")

    # Seed isolated temporary database
    sync_competition_cases(db_path=test_cases_db)

    reset_case_service()
    reset_decision_ledger()
    reset_mcp_dispatcher()
    yield
    reset_case_service()
    reset_decision_ledger()
    reset_mcp_dispatcher()
