"""Unit tests for Uncertainty Engine and Additional Evidence Loop."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.agents.state_machine import FraudInvestigationAgent
from backend.app.cases.service import get_case_service
from backend.app.schemas.case import CaseStatus, ActionType
from backend.app.graph.client import get_default_graph_client, InMemoryTigerGraphSimulator


def test_uncertainty_step_up_loop():
    case_svc = get_case_service()
    client = get_default_graph_client()

    case_id = "TEST-UNCERTAIN-CASE-01"
    txn_id = "TXN_TEST_UNCERTAIN"
    cust_id = "CUST_TEST_UNCERTAIN"

    # Seed an isolated high-risk transaction without strong graph edges
    if isinstance(client, InMemoryTigerGraphSimulator):
        client.add_vertex("Transaction", txn_id, {
            "id": txn_id, "amount": 1200.0, "timestamp": 1715000000,
            "risk_score": 0.72, "billing_region": "CA"
        })

    # Create fresh case with high risk but low confidence
    case_svc.create_case(
        case_id=case_id,
        trigger_txn_id=txn_id,
        subject_customer_id=cust_id,
        initial_risk=0.72,
        initial_confidence=0.45
    )

    agent = FraudInvestigationAgent()
    res = agent.run_investigation(
        case_id=case_id,
        allow_evidence_step_up=True,
        simulate_step_up_success=True
    )

    case = res["case"]
    assert case["risk_score"] >= 0.60
    # Following simulated step-up challenge failure, confidence is upgraded significantly
    assert case["confidence"] >= 0.55
    assert any("EV_STEPUP" in e["id"] for e in case["supporting_evidence"])

    # Verifies step-up occurred in timeline
    timeline_steps = [s["step_name"] for s in res["timeline"]]
    assert "UNCERTAINTY_CHECK" in timeline_steps
    assert "REASSESSMENT" in timeline_steps
