"""Test verifying that production database has no test or synthetic records."""
import sqlite3
import os

def test_production_store_has_no_test_or_synthetic_records():
    """Fail if any TEST-* or CASE-0* record appears in production data/cases.db."""
    db_path = "data/cases.db"
    if not os.path.exists(db_path):
        return
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cases = [r[0] for r in cursor.execute("SELECT case_id FROM cases").fetchall()]

    polluted = [c for c in cases if c.startswith("TEST-") or c.startswith("CASE-0") or "UNKNOWN" in c]
    assert not polluted, f"Production database polluted with non-competition cases: {polluted}"
    
    # Must contain only official HHG benchmark cases
    non_hhg = [c for c in cases if not c.startswith("HHG-")]
    assert not non_hhg, f"Production database contains non-HHG cases: {non_hhg}"
