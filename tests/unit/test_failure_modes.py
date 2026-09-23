"""Failure mode unit tests testing graceful degradation and safety guarantees."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.graph.client import get_default_graph_client
from backend.app.audit.ledger import get_decision_ledger
from backend.app.agents.state_machine import FraudInvestigationAgent
from backend.app.schemas.case import CaseStatus


def test_missing_transaction_graceful_handling():
    """Verify that querying a nonexistent transaction returns empty context, not a crash."""
    client = get_default_graph_client()
    res = client.query_transaction_neighborhood("NONEXISTENT_TXN_999999", depth=2)
    assert res["node_count"] == 0
    assert res["edge_count"] == 0
    assert res["nodes"] == []


def test_tampered_ledger_detection():
    """Verify that any tampering with the SHA-256 hash chain invalidates verification."""
    ledger = get_decision_ledger()
    import time
    case_id = f"TEST-TAMPER-{time.time()}"

    ledger.record_event(
        case_id=case_id,
        actor="TestRunner",
        event_type="STEP_1",
        input_data={"data": 1},
        decision="DECIDE_1",
        reason="Reason 1",
        confidence=0.5
    )
    ledger.record_event(
        case_id=case_id,
        actor="TestRunner",
        event_type="STEP_2",
        input_data={"data": 2},
        decision="DECIDE_2",
        reason="Reason 2",
        confidence=0.8
    )

    # Initial chain is valid
    assert ledger.verify_case_ledger(case_id)["is_valid"] is True

    # Tamper with an event in SQLite database
    import sqlite3
    with sqlite3.connect(ledger.db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE ledger_entries SET reason = 'TAMPERED_FRAUDULENT_REASON' WHERE case_id = ? AND event_type = 'STEP_1'",
            (case_id,)
        )
        conn.commit()

    # Verification must now fail!
    tamper_check = ledger.verify_case_ledger(case_id)
    assert tamper_check["is_valid"] is False
    assert "reason" in tamper_check
    assert "Content altered" in tamper_check["reason"] or "Broken" in tamper_check["reason"]


def test_agent_investigation_handles_unknown_case():
    """Verify the agent safely initiates and handles completely unknown case identifiers."""
    agent = FraudInvestigationAgent()
    case_id = "CASE-BRAND-NEW-UNKNOWN"

    res = agent.run_investigation(case_id)
    assert res["case"]["case_id"] == case_id
    assert res["case"]["status"] in (CaseStatus.RESOLVED.value, CaseStatus.APPROVAL_PENDING.value)
    assert len(res["timeline"]) > 5
    assert res["ledger_verified"] is True
