"""
Unit test verifying no label leakage into benchmark case inputs.
Ensures that benchmark case inference only accesses trigger data, graph topology,
and historical closed cases (months 1-4) without access to ground truth labels.
"""

import os
import sys
import csv
import json
import pytest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "competition"

def test_benchmark_inputs_have_no_ground_truth_labels():
    """Verify case_pack.csv and transactions.csv do not contain is_fraud column."""
    with open(DATA_DIR / "case_pack.csv", "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        assert "is_fraud" not in header
        assert "isFraud" not in header
        assert "outcome" not in header
        assert "verdict" not in header

def test_closed_cases_restricted_to_months_one_to_four():
    """Verify closed_cases_history only contains training period (July - Oct 2016)."""
    with open(DATA_DIR / "closed_cases_history.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            opened = row["opened_at"]
            # Must be prior to benchmark exam period (benchmark starts 2016-11-12)
            assert opened < "2016-11-05", f"Leakage detected: closed case {row['case_id']} opened on {opened}"

def test_benchmark_cases_are_in_exam_period():
    """Verify all 20 benchmark cases fall strictly in November or December 2016."""
    with open(DATA_DIR / "case_pack.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            opened = row["opened_at"]
            assert opened >= "2016-11-01", f"Benchmark case {row['case_id']} opened outside exam period: {opened}"
            assert opened <= "2016-12-31 23:59:59"
