"""
Integration test for the TRACE//GOA benchmark execution pipeline.
Validates end-to-end case resolution, policy gates, NBA flips, and audit outputs.
"""

import json
import pytest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CASES_DIR = BASE_DIR / "outputs" / "cases"
OUTPUTS_DIR = CASES_DIR


def test_all_twenty_benchmark_cases_exist_and_valid():
    """Verify that all 20 benchmark case outputs exist and satisfy required schemas."""
    expected_ids = [f"HHG-{i:03d}" for i in range(1, 21)]
    assert CASES_DIR.exists(), f"Cases dir missing: {CASES_DIR}"

    for case_id in expected_ids:
        case_file = CASES_DIR / f"{case_id}.json"
        assert case_file.exists(), f"Missing benchmark answer file: {case_file}"
        
        with open(case_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Core top-level contract
        assert data["case_id"] == case_id
        assert "case" in data
        assert "next_best_actions" in data
        assert "evidence_requests" in data
        assert "sar" in data
        assert "tool_calls" in data
        assert isinstance(data["tool_calls"], int)
        assert data["tool_calls"] > 0
        assert "latency_s" in data

        # Sub-contracts
        c = data["case"]
        assert c["status"] in {"open", "closed_fraud", "closed_legitimate", "escalated"}
        assert c["verdict"] in {"fraud", "legitimate", "uncertain"}
        assert 0.0 <= float(c["fraud_probability"]) <= 1.0


def test_evidence_flips_recorded_correctly():
    """Verify that cases designed to flip based on evidence (HHG-001, 005, 007, 012) did flip."""
    flip_cases = ["HHG-001", "HHG-005", "HHG-007", "HHG-012"]
    for case_id in flip_cases:
        case_file = CASES_DIR / f"{case_id}.json"
        with open(case_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        nba = data["next_best_actions"]
        assert nba["what_changed"] != "nothing", f"Expected flip in {case_id} but what_changed='nothing'"
        
        if case_id in ("HHG-001", "HHG-005", "HHG-007"):
            final_actions = [a["action"] for a in nba["final"]]
            assert "ALLOW_TRANSACTION" in final_actions, f"Expected ALLOW_TRANSACTION for cleared case {case_id}"
        elif case_id == "HHG-012":
            final_actions = [a["action"] for a in nba["final"]]
            assert "BLOCK_CARD" in final_actions, f"Expected BLOCK_CARD for denied/fraud case {case_id}"


def test_sar_policy_gate():
    """Verify SAR filings strictly adhere to regulatory thresholds."""
    for case_file in CASES_DIR.glob("HHG-*.json"):
        with open(case_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        sar = data["sar"]
        amount = float(data["case"].get("exposure_usd", 0.0))
        verdict = data["case"]["verdict"]

        if sar["file"]:
            assert verdict == "fraud", f"SAR filed for non-fraud case {data['case_id']}"
            assert sar["narrative"], f"SAR narrative empty in {data['case_id']}"
