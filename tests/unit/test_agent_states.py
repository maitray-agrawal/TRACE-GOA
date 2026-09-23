"""Unit tests for Agent 17-State Finite State Machine and Transitions."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.agents.state_machine import FraudInvestigationAgent
from backend.app.schemas.case import CaseStatus
from backend.app.cases.service import get_case_service


def test_17_state_timeline_progression():
    agent = FraudInvestigationAgent()
    case_svc = get_case_service()

    case_id = "TEST-AGENT-17-STATE"
    res = agent.run_investigation(case_id, allow_evidence_step_up=True)

    timeline = res["timeline"]
    states_observed = [step.get("state") for step in timeline if step.get("state")]

    # Core states that must have been executed
    expected_states = [
        CaseStatus.TRIGGERED.value,
        CaseStatus.CASE_CREATED.value,
        CaseStatus.PLANNING.value,
        CaseStatus.INVESTIGATING.value,
        CaseStatus.EVIDENCE_COLLECTION.value,
        CaseStatus.PATTERN_ANALYSIS.value,
        CaseStatus.RISK_ASSESSMENT.value,
        CaseStatus.UNCERTAINTY_ANALYSIS.value,
        CaseStatus.ACTION_PLANNING.value,
        CaseStatus.POLICY_CHECK.value,
        CaseStatus.CASE_UPDATE.value,
        CaseStatus.MEMORY_UPDATE.value,
    ]

    for expected in expected_states:
        assert expected in states_observed, f"State {expected} was not recorded in agent timeline"

    # Verify final case status is valid
    case = case_svc.get_case(case_id)
    assert case is not None
    assert case.status in (CaseStatus.RESOLVED, CaseStatus.APPROVAL_PENDING)


def test_agent_dynamic_tool_planning():
    agent = FraudInvestigationAgent()
    case_id = "TEST-AGENT-DYNAMIC-PLAN"

    res = agent.run_investigation(case_id)
    timeline = res["timeline"]

    # Look for planning step
    planning_step = next((s for s in timeline if s["step_name"] == "INVESTIGATION_PLANNING"), None)
    assert planning_step is not None
    assert "query_neighborhood" in planning_step["details"]
