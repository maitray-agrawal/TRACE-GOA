"""Unit tests for Persistent Case Memory Service."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.memory.service import get_memory_service
from backend.app.schemas.case import CaseRecord, CaseStatus


def test_case_memory_record_and_search():
    mem_svc = get_memory_service()

    case = CaseRecord(
        case_id="TEST-MEM-CASE-01",
        trigger_txn_id="TXN_MEM_01",
        subject_customer_id="CUST_MEM_01",
        status=CaseStatus.RESOLVED,
        risk_score=0.92,
        confidence=0.88,
        fraud_patterns=["DEVICE_FARM"]
    )

    summary = "High-velocity account opening and card testing originating from emulated device cluster in Eastern Europe."
    mem_svc.record_case_memory(
        case=case,
        summary=summary,
        analyst_outcome="CONFIRMED_FRAUD"
    )

    # Search memory for matching pattern
    results = mem_svc.search_similar_cases(query_text="device cluster testing", pattern_filter="DEVICE_FARM", top_k=50)
    assert len(results) >= 1
    found_case_ids = [r["case_id"] for r in results]
    assert "TEST-MEM-CASE-01" in found_case_ids
