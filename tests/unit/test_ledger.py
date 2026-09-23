"""Unit tests for Cryptographic Tamper-Evident Decision Ledger."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.audit.ledger import DecisionLedger, GENESIS_HASH


def test_ledger_hash_chain_and_verification(tmp_path):
    db_file = str(tmp_path / "test_ledger.db")
    ledger = DecisionLedger(db_path=db_file)
    case_id = "TEST-CASE-001"

    # 1. Genesis event
    e1 = ledger.record_event(
        case_id=case_id,
        actor="System",
        event_type="TRIGGER_INGEST",
        input_data={"txn": "TXN_001"},
        decision="OPEN",
        confidence=0.5
    )
    assert e1["previous_hash"] == GENESIS_HASH
    assert len(e1["current_hash"]) == 64

    # 2. Second event
    e2 = ledger.record_event(
        case_id=case_id,
        actor="Agent",
        event_type="PATTERN_DETECTED",
        input_data={"pattern": "DEVICE_FARM"},
        decision="EVALUATE",
        confidence=0.88
    )
    assert e2["previous_hash"] == e1["current_hash"]

    # 3. Verify valid chain
    status = ledger.verify_case_ledger(case_id)
    assert status["is_valid"] is True
    assert status["entries_checked"] == 2


def test_tamper_detection(tmp_path):
    import sqlite3
    db_file = str(tmp_path / "test_ledger_tamper.db")
    ledger = DecisionLedger(db_path=db_file)
    case_id = "TEST-CASE-TAMPER"

    e1 = ledger.record_event(case_id=case_id, actor="Agent", event_type="E1", input_data="data1")
    e2 = ledger.record_event(case_id=case_id, actor="Agent", event_type="E2", input_data="data2")

    # Manually tamper with an event's decision in the database
    with sqlite3.connect(db_file) as conn:
        conn.execute("UPDATE ledger_entries SET decision = 'TAMPERED_FRAUD' WHERE entry_id = 1")
        conn.commit()

    # Verify tampering is detected
    status = ledger.verify_case_ledger(case_id)
    assert status["is_valid"] is False
    assert "tamper_detected_at_entry" in status
